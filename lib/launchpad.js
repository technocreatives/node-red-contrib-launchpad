module.exports = function(RED) {
  'use strict';

  var Launchpad = require('midi-launchpad');

  function stringToColor(str, launchpad) {
    switch(str) {

      case 'red.low': return launchpad.colors.red.low;
      case 'red.medium': return launchpad.colors.red.medium;
      case 'red.high':
      case 'red': return launchpad.colors.red.high;

      case 'green.low': return launchpad.colors.green.low;
      case 'green.medium': return launchpad.colors.green.medium;
      case 'green.high':
      case 'green': return launchpad.colors.green.high;

      case 'orange.low': return launchpad.colors.orange.low;
      case 'orange.medium': return launchpad.colors.orange.medium;
      case 'orange.high':
      case 'orange': return launchpad.colors.orange.high;

      case 'yellow.low': return launchpad.colors.yellow.low;
      case 'yellow.medium': return launchpad.colors.yellow.medium;
      case 'yellow.high':
      case 'yellow': return launchpad.colors.yellow.high;

      case 'off': return launchpad.colors.off;
      default: return launchpad.colors.off;

    }
  }

  function LaunchpadNode(n) {
    RED.nodes.createNode(this,n);
    var node = this;

    this.port = Number(n.port||0);
    this.initAnimation = n.initanim;
    this.connected = false;
    this.connecting = false;
    this.closing = false;

    // Button in/out nodes connected to this Launchpad
    this.users = {};

    this.register = function(buttonNode) {
      node.users[buttonNode.id] = buttonNode;
      if(Object.keys(node.users).length === 1) {
        node.connect();
      }
    };

    this.deregister = function(buttonNode, done) {
      delete node.users[buttonNode.id];
      if(node.closing) {
        return done();
      }
      if(Object.keys(node.users).length === 0) {
        if(node.launchpad) {
          // TODO: close launchpad?
          return;
        }
      }
      done();
    };

    this.connect = function() {
      console.log('connecting to launchpad');
      if(node.connected || node.connecting) {
        return;
      }
      node.connecting = true;
      node.launchpad = Launchpad.connect(node.port, node.initAnimation);
      for(var id in node.users) {
        if(node.users.hasOwnProperty(id)) {
          node.users[id].status({fill:'yellow', shape:'dot', text:'Connecting'});
        }
      }
      console.log('done settung status');

      node.launchpad.on('ready', function(){
        console.log('on ready');
        node.connecting = false;
        node.connected = true;
        node.log(RED._('Launchpad connected'));
        for(var id in node.users) {
          if(node.users.hasOwnProperty(id)) {
            node.users[id].status({fill:'green', shape:'dot', text:'Connected'});
          }
        }
      });
    };

    this.on('close', function(done){
      node.closing = true;
      if(node.connected) {
        // TODO: disconenct launchpad midi port?
        node.connected = false;
        done();
      } else {
        node.connected = false;
        done();
      }
    });
  }

  RED.nodes.registerType('launchpad', LaunchpadNode);

  function ButtonInNode(n) {
    RED.nodes.createNode(this, n);

    this.xcoord = Number(n.xcoord);
    this.ycoord = Number(n.ycoord);
    this.allButtons = n.allbuttons;
    this.launchpadNode = RED.nodes.getNode(n.launchpad);
    var node = this;

    if(!this.launchpadNode) {
      this.error(RED._('Missing Launchpad node'));
      return;
    }
    console.log('Registering this button-in with the launchpad');
    this.launchpadNode.register(this);
    console.log('Done registering');

    this.status({fill:'red', shape:'ring', text:'Disconnected'});
    if(this.launchpadNode.connected) {
      this.status({fill:'green', shape:'dot', text:'Connected'});
    }

    var pressedPayload = 1;
    var releasedPayload = 0;

    if(!this.allButtons) {
      console.log('getting bytton at ' + this.xcoord + ',' + this.ycoord);
      this.button = this.launchpadNode.launchpad.getButton(this.xcoord, this.ycoord);
      if(!this.button) {
        this.error(RED._('Invalid button index: ' + this.xcoord + ',' + this.ycoord));
        return;
      }

      this.button.on('press', function(){
        node.send({ payload: pressedPayload, x: node.button.xcoord, y: node.button.ycoord, __launchpad: {button: node.button}});
      }, this.id);

      this.button.on('release', function(){
        node.send({ payload: releasedPayload, x: node.button.xcoord, y: node.button.ycoord, __launchpad: {button: node.button}});
      }, this.id);

    } else {
      console.log('Listening to all buttons');

      this.launchpadNode.launchpad.on('press', function(button){
        node.send({ payload: pressedPayload, x: button.xcoord, ycoord: button.y, __launchpad: {button: button}});
      }, this.id);

      this.launchpadNode.launchpad.on('release', function(button){
        node.send({ payload: releasedPayload, x: button.xcoord, ycoord: button.y, __launchpad: {button: button}});
      }, this.id);

    }

    this.on('close', function(done){
      // Remove all callbacks on button and launchpad (node is is context)
      if(node.button) {
        node.button.off(null, null, node.id);
      }
      if(node.launchpadNode && node.launchpadNode.launchpad) {
        node.launchpadNode.launchpad.off(null, null, node.id);
      }
      node.launchpadNode.deregister(node, done);
    });


  }

  RED.nodes.registerType('button-in', ButtonInNode);

  function ButtonOutNode(n) {

    RED.nodes.createNode(this, n);
    this.xcoord = Number(n.xcoord);
    this.ycoord = Number(n.ycoord);
    this.allButtons = n.allbuttons;

    this.launchpadNode = RED.nodes.getNode(n.launchpad);
    var node = this;

    if(!this.launchpadNode) {
      this.error(RED._('Missing Launchpad node'));
      return;
    }
    this.launchpadNode.register(this);

    this.status({fill:'red', shape:'ring', text:'Disconnected'});
    if(this.launchpadNode.connected) {
      this.status({fill:'green', shape:'dot', text:'Connected'});
    }

    if(!this.allButtons) {
      console.log('getting bytton at ' + this.xcoord + ',' + this.ycoord);
      this.button = this.launchpadNode.launchpad.getButton(this.xcoord, this.ycoord);
      if(!this.button) {
        this.error(RED._('Invalid button index: ' + this.xcoord + ',' + this.ycoord));
        return;
      }
    }

    this.on('input', function(msg){
      var color = stringToColor(msg.payload, node.launchpadNode.launchpad);
      if(msg.__launchpad && msg.__launchpad.button) {
        msg.__launchpad.button.light(color);
      } else if(node.button) {
        node.button.light(color); //setState would be more appropriate, but there is some redundancey in the Launchpad implementation
      } else {
        node.launchpadNode.launchpad.allLight(color);
      }
    });

    this.on('close', function(done){
      node.launchpadNode.deregister(node, done);
    });

  }

  RED.nodes.registerType('button-out', ButtonOutNode);
};

