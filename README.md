https://github.com/virtualcodewarrior/vicowa-web-components/workflows/vicowa-web-components-test-and-build/badge.svg

# Introduction
This is a collection of web components that make use of web-component-base-class
Usage examples of the web components can be found in the examples folder.

## Installation
To install run
```
npm install --save vicowa-web-components
```

## Examples
You can test the examples by starting the server

Start the server
```
npm start
```
Browse to ```http://localhost:8989``` and open any of the example folders.


# vicowa-string
string web component that has build in translation features.

# vicowa-icon-set
Creates a collection of svg based icons that can be used through vicowa-icon

# vicowa-icon
Shows an icon from a collection of icons

# vicowa-input
Text input field with build-in validation support

# vicowa-panel
A optionally collapsible panel, containing a header and footer

# vicowa-resize-detector
Place this web component within a positioned block element (e.g. <div style="position: relative"></div>) to be able to detect if the parent div's
size changes.

# vicowa-sidebar
A two section block element where one of the sections is a collapsible panel. Its intended use is
as part of the main web layout to support a collapsible navigation section or collapsible property section
The collapsible panel can be either on-top or in-place and will switch to on-top by default when
the total size shrinks beyond a certain point. The collapsible panel can be positioned at either of the 4 sides.

# vicowa-data-grid
A control that shows a grid of data like a spreadsheet, but actually uses a "virtual" system to allow
big data sets to be shown without creating a large amount of DOM elements.

