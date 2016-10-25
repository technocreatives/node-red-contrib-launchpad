var midi = require('midi');
var midiConnector = require('midi-launchpad').connect(0, false);
var midiConnector2 = require('midi-launchpad').connect(0, false);

 
// wait for the connector to be ready 
midiConnector.on("ready",function(launchpad) {
  console.log("Launchpad ready, let's do something");
  //launchpad.allLight(launchpad.colors.red.high);

  var button = launchpad.getButton(1,1);
  button.on("press", function(button){
    console.log(button.x + ',' + button.y + ' pressed');
  });
  button.on("release", function(){
    console.log('button 1,1 released');
  });

  launchpad.on("press", function(button){
    console.log(button.x + ',' + button.y + ' pressed');
    button.light(launchpad.colors.yellow.medium);
  });
  launchpad.on("release", function(button){
    console.log(button.x + ',' + button.y + ' released');
    button.dark();
  });

  console.log('colors off', launchpad.colors.off);

  console.log('red low', launchpad.colors.red.low);
  console.log('red medium', launchpad.colors.red.medium);
  console.log('red high', launchpad.colors.red.high);

  console.log('green low', launchpad.colors.green.low);
  console.log('green medium', launchpad.colors.green.medium);
  console.log('green high', launchpad.colors.green.high);

  console.log('orange low', launchpad.colors.orange.low);
  console.log('orange medium', launchpad.colors.orange.medium);
  console.log('orange high', launchpad.colors.orange.high);

  console.log('yellow low', launchpad.colors.yellow.low);
  console.log('yellow medium', launchpad.colors.yellow.medium);
  console.log('yellow high', launchpad.colors.yellow.high);

  /**

colors off 0
red low 1
red medium 2
red high 3
green low 16
green medium 32
green high 48
orange low 45
orange medium 46
orange high 23
yellow low 17
yellow medium 34
yellow high 54

*/

});
