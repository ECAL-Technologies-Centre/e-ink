# e-ink

## Getting Started

#### Running a sketch on the Visionect Display
1. Download one of the example folders of the repository:
	- **empty_p5**: Ready to be used with p5.js.
	- **empty**: Ready to be used with vanilla htmlCanvas or other canvas libraries.
	- **ball**: Simple example running on p5.js.
2. Connect to the WiFi **ct-zotac-2**. Password: **ecalecal**.
3. Uncomment the line `Ink.connect ...` in the **sketch.js** file.
4. Run your example folder on a [localhost](https://flaviocopes.com/local-web-server/ "localhost").
5. ???
6. Profit.

#### Running multiple sketches with the *Visionect Sketch Selector*
1. Use the PC **zotac-2**. Open [localhost:3000](http://localhost:3000) on Chrome.
2. Select the sketch you want to display on the e-paper.

#### Running the sketch offline
1. Comment out the line `Ink.connect...`.

#### Changing the time
1. Click anywhere on the canvas. A popup will show the current time.
2. Click on any digits of `00:00:00`. Hours, minutes and seconds are changed indepedently. You can also drag them for fast incrementation.
3. Click outside the digits to close the popup.


------------


## Troubleshoot

#### Cannot connect to ct-zotac-2
1. Make sure the PC Zotac-2 is ON. Zotac-2 is the second PC on the left row of the entry.
2. Go to *Settings  > Network & Internet > Mobile hotspot.*
3. Switch it on.

#### Connection error in the console.log of your sketch
1. Open [localhost:3000](http://localhost:3000 "localhost:3000") on Zotac-2.
2. If it doesn't work. You need to run the latest version of the Visionect Sketch Selector on zotac-2:
	1. Download the folder server of this repository.
	2. Navigate to the downloaded folder using the Command Prompt. Write `cd `+ the path to the folder). Press Enter.
	3. Write `npm install`. Press Enter. Wait.
	4. Write `node server.js`. Press Enter.
	5. Done. Confirm by going to [localhost:3000](http://localhost:3000 "localhost:3000").
3. Make sure only one Visionect Sketch Selector is running at the same time.

#### Still cannot connect to the Visionect Display.
1. Make sure the wifi ct-zotac-2 is on.
2. The display might be sleeping. Connect a USB-C to USB-A cable to the right port of the display. Plug it on a phone charger. You should hear a small bip noise.
3. From the PC zotac-2. Go to [localhost:8081](http://localhost:8081 "localhost:8081") on a browser.
4. You should be connected to the Visionect Server. One device should be online.

#### Still having WTF issues.
Ask Sébatien Matos or Tibor Udvari for additionnal help.


------------


## Ink.js
Ink is an object that sends the frames of your htmlCanvas to the Visionect Sketch Selector.

### Properties

###### Ink.id `String`
Name of your sketch displayed on the *Visionect Sketch Selector*.\
**"anonymous"**: Default value.

###### Ink.host `String`
IP address of the server *Visionect Sketch Selector*.\
**"192.168.137.1"**: Default value. To use if the server is running on the PC zotac-2.

###### Ink.port `Int`
Port on which the server *Visionect Sketch Selector* is running.\
**3000**: Default value.

###### Ink.options.dimensions `[ Int, Int ]`
Dimensions of the Visionect Display. This is also the size of your htmlCanvas.\
**[2560, 1440]**: Landscape mode. Default value.\
**[1440, 2560]**: Portrait mode.

###### Ink.options.dither `Int`
Dithering used by the Visionect Display to draw different shades of gray using only black and white pixels.\
**"bayer"**: Ordered dithering. Default value.\
**"floyd-steinberg"**: Randomized dithering.\
**"none"**: No dithering.

###### Ink.options.bit `Int`
Pixel mode of the Visionect Display.\
**1**: 1-bit (black or white pixels). Default value.\
**4**: 4-bit (16 shades of gray). Inverts the screen of each frame to prevent ghosting.

###### Ink.options.invert `Boolean`
Inverts the screen of each frame to prevent ghosting.\
**false**: Default value.

###### Ink.options.optimize `Boolean`
Renders a better image quality.\
**true**: Default value.

###### Ink.options.partial `Boolean`
Can make only partial updates of the screen.\
**true**: Default value.

###### Ink.options.context `CanvasRenderingContext2D `,`WebGLRenderingContext`
2d context of your htmlCanvas.\
**drawingContext**: Context of p5.js by default.

###### Ink.options.loop `Function`
Function called to resume the drawing of your htmlCanvas.\
**() => loop()**: Default value. Calls the loop function of p5.js

###### Ink.options.noLoop `Function`
Function called to pause the drawing of your htmlCanvas.\
**() => noLoop()**: Default value. Calls the noLoop function of p5.js.

### Methods

###### Ink.connect( Object )
Initialize connection to the *Visionect Sketch Selector*. Should be called once. You can pass any Ink properties listed above to overwrite the default values.\
Example:
```javascript
Ink.connect({
	id: 'jean',
	options: {
		dither: 'bayer',
		invert: false,
		dimensions: [2560, 1440]
	}
});
```
###### Ink.capture( Object )
Sends a screenshot of your canvas rendering context. You can also overwrite the e paper parameter with an object by passing them as the argument.
Example:
```javascript
Ink.capture({
	invert: true,
	bit: 1
});
```


------------


## Clock.js
Clock is an object built on top of the `Date` object. Clock keeps updating the `Date` object constantly.

### Properties

###### Clock.trueTime `Boolean`
**false**: Default value. You have to manually update the Clock using the `Clock.tick()` method.\
**true**: Clock will always be set to the clock of your computer. It will be updated when you call any of the Clock methods.

###### Clock.onSecondChange `Function`
Will be called on each minutes.\
Example:
```javascript
Clock.onSecondChange = function(value) {
	console.log('New second: ' + value);
}
```
###### Clock.onMinuteChange `Function`
Will be called on each seconds.

###### Clock.onHourChange `Function`
Will be called on each hours.

### Methods

###### Inherited methods
Clock inherits every [methods](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date "methods") of the `Date` object.\
Examples: `Clock.getMinutes()`,` Clock.setHours()`, `Clock.setTime()`, etc.

###### Clock.init( Object )
Initializes the Clock. You can pass a `Date` object to set the start time.\
Example:
```javascript
Clock.init({ date: new Date(), trueTime: false });
```
###### Clock.tick( Int )
Updates the time of Clock by incrementing it with a value in milliseconds.\
Default value is `1000` (milliseconds). Only works if `Clock.trueTime` is set to false.\
Example:
```javascript
Clock.tick(2000); //will add 2 seconds to the time.
```
###### Clock.display( Object )
Draws a small clock on the top left of your htmlCanvas.\
Default color is set to black, default scale is 1.\
Example:
```javascript
Clock.display({
	scale: 1,
	black: true,
	context: ctx
});
```
