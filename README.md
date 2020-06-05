This repo is forked from acos-server/acos-lti to add DeepLink support to it. In the future, changes should have pushed to the original repo.

# Acos LTI protocol support

This protocol adds the support for communication between
learning management systems that support LTI (Moodle, for example)
and ACOS server.

Configuration
-------------

Add the following line to the ACOS config file

```ltiKeys: {consumerKey: 'key', consumerSecret: 'secret'}```

and change the keys. Typically, these keys are required when a new
LTI activity is added to learning management systems.
