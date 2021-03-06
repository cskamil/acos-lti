var http = require('http');
var util = require('util');
var lti = require('ims-lti');
var htmlencode = require('htmlencode').htmlEncode;
var nj = require('nunjucks');

var ACOSLTI = function() {};

// Override these default keys by adding a new setting 'ltiKeys' to the
// config file, for example:
//    ltiKeys: {consumerKey: 'newKey', consumerSecret: 'newSecret'}
ACOSLTI.keys = { consumerKey: 'acos', consumerSecret: 'acos' };


ACOSLTI.addToHead = function(params) {
  params.headContent += '<script src="/static/lti/jquery.min.js" type="text/javascript"></script>\n';
  params.headContent += '<script src="/static/lti/events.js" type="text/javascript"></script>\n';
  return true;
};

ACOSLTI.addToBody = function(params, req) {
  params.bodyContent += '<input type="hidden" name="user_id" value="' + htmlencode(req.body.user_id || '') + '"/>\n';
  params.bodyContent += '<input type="hidden" name="lis_result_sourcedid" value="' + htmlencode(req.body.lis_result_sourcedid || '') + '"/>\n';
  params.bodyContent += '<input type="hidden" name="lis_outcome_service_url" value="' + htmlencode(req.body.lis_outcome_service_url || '') + '"/>\n';
  return true;
};

ACOSLTI.initialize = function(req, params, handlers, cb) {
  var templateDir = __dirname + '/templates/';
  nj.configure(templateDir, { autoescape: false });

  // Initialize the protocol
  var provider = new lti.Provider(ACOSLTI.keys.consumerKey, ACOSLTI.keys.consumerSecret);
  provider.valid_request(req, function(err, isValid) {
    if (!isValid) {
      params.error = 'LTI initialization error.';
    }
  });

  if (!params.error) {
    ACOSLTI.addToHead(params, req);
    
    if(!provider.ext_content) { // To check if the request is ContentItemSelectionRequest => TODO: Could be done better
      ACOSLTI.addToBody(params, req);
      // Initialize the content type (and content package)
      handlers.contentTypes[req.params.contentType].initialize(req, params, handlers, function() {
        cb();
      });
    } else {
      params.headContent += '<script src="/static/lti/acos-lti-content-selection.js" type="text/javascript"></script>\n'

      params.type = 'content_selection'
      var url_base = req.protocol + '://' + req.get('host') + '/' + req.params.protocol
    
      var inner_params = {
        contentPackages: [],
        content_url_base: url_base,
        content_item_return_url: provider.ext_content.content_item_return_url,
        formData: {
          oauth_consumer_key: provider.consumer_key
        }
      }

      if(provider.ext_content.data && provider.ext_content.data.length > 0) {
        inner_params.formData.data = provider.ext_content.data
      }

      for (var contentPackage in handlers.contentPackages) {
        inner_params.contentPackages.push(handlers.contentPackages[contentPackage]);
      }

      params.bodyContent += nj.render('content_selection.html', inner_params)
      cb()
    }
  } else {
    cb();
  }

};

ACOSLTI.handleEvent = function(event, payload, req, res, protocolData, responseObj, cb) {

  if (event == 'grade') {

    if (protocolData.lis_result_sourcedid !== undefined && protocolData.lis_outcome_service_url !== undefined && payload.max_points !== undefined && payload.points !== undefined) {

      var provider = new lti.Provider(ACOSLTI.keys.consumerKey, ACOSLTI.keys.consumerSecret);
      provider.body = {
        lis_outcome_service_url: protocolData.lis_outcome_service_url,
        lis_result_sourcedid: protocolData.lis_result_sourcedid
      };

      var outcome = new lti.Extensions.Outcomes.init(provider);
      outcome.send_replace_result(payload.points / payload.max_points, function(err, result) {

        if (!err && result) {
          res.json({ 'status': 'OK', 'protocol': responseObj.protocol, 'content': responseObj.content });
        } else {
          res.json({ 'status': 'ERROR', 'message': err, 'protocol': responseObj.protocol, 'content': responseObj.content });
        }

        cb(event, payload, req, res, protocolData, responseObj);

      });

    } else {
      res.json({ 'status': 'ERROR', 'message': 'Invalid LTI parameters', 'protocol': responseObj.protocol, 'content': responseObj.content });
      cb(event, payload, req, res, protocolData, responseObj);
    }

  } else {
    res.json({ 'status': 'OK', 'protocol': responseObj.protocol, 'content': responseObj.content });
    cb(event, payload, req, res, protocolData, responseObj);
  }


};

ACOSLTI.register = function(handlers, app, config) {
  handlers.protocols.lti = ACOSLTI;

  // Override the default keys if specified in the config file
  if (config.ltiKeys && config.ltiKeys.consumerKey && config.ltiKeys.consumerSecret) {
    ACOSLTI.keys.consumerKey = config.ltiKeys.consumerKey;
    ACOSLTI.keys.consumerSecret = config.ltiKeys.consumerSecret;
  } else {
    console.log('[LTI Protocol] Warning: LTI keys are not specified in the config file.');
  }
};

ACOSLTI.namespace = 'lti';
ACOSLTI.packageType = 'protocol';

ACOSLTI.meta = {
  'name': 'lti',
  'shortDescription': 'Protocol to load content and submit grades by using LTI.',
  'description': '',
  'author': 'Teemu Sirkiä',
  'license': 'MIT',
  'version': '0.2.0',
  'url': ''
};

module.exports = ACOSLTI;
