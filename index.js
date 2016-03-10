var http = require('http');
var util = require('util');
var lti = require('ims-lti');
var htmlencode = require('htmlencode').htmlEncode;

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

  // Initialize the protocol
  var provider = new lti.Provider(ACOSLTI.keys.consumerKey, ACOSLTI.keys.consumerSecret);
  provider.valid_request(req, function(err, isValid) {

    if (isValid) {
      var result = ACOSLTI.addToHead(params, req);
      result = result && ACOSLTI.addToBody(params, req);
    } else {
      params.error = 'LTI initialization error.';
    }

  });


  if (!params.error) {
    // Initialize the content type (and content package)
    handlers.contentTypes[req.params.contentType].initialize(req, params, handlers, function() {
      cb();
    });
  } else {
    cb();
  }

};

ACOSLTI.handleEvent = function(event, payload, req, res, protocolData) {

  if (event == 'grade') {

    if (protocolData.lis_result_sourcedid !== undefined && protocolData.lis_outcome_service_url !== undefined && payload.max_points !== undefined && payload.points !== undefined) {

      var provider = new lti.Provider(ACOSLTI.keys.consumerKey, ACOSLTI.keys.consumerSecret);
      provider.body = {
        lis_outcome_service_url: protocolData.lis_outcome_service_url,
        lis_result_sourcedid: protocolData.lis_result_sourcedid
      };

      var outcome = new lti.Extensions.Outcomes.OutcomeService(provider);
      outcome.send_replace_result(payload.points / payload.max_points, function(err, result) {

        if (!err && result) {
          res.json({ 'status': 'OK' });
        } else {
          res.json({ 'status': 'ERROR', 'message': err });
        }

      });

    } else {
      res.json({ 'status': 'ERROR', 'message': 'Invalid LTI parameters' });
    }

  } else {
    res.json({ 'status': 'OK' });
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
  'version': '0.0.1',
  'url': ''
};

module.exports = ACOSLTI;