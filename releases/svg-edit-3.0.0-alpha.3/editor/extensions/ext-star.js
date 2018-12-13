/* globals jQuery */
/*
 * ext-star.js
 *
 *
 * Copyright(c) 2010 CloudCanvas, Inc.
 * All rights reserved
 *
 */
import svgEditor from '../svg-editor.js';
svgEditor.addExtension('star', function (S) {
  const $ = jQuery;
  const svgCanvas = svgEditor.canvas;

  let // {svgcontent} = S,
    selElems,
    // editingitex = false,
    // svgdoc = S.svgroot.parentNode.ownerDocument,
    started,
    newFO;
    // edg = 0,
    // newFOG, newFOGParent, newDef, newImageName, newMaskID,
    // undoCommand = 'Not image',
    // modeChangeG, ccZoom, wEl, hEl, wOffset, hOffset, ccRgbEl, brushW, brushH;

  function showPanel (on) {
    let fcRules = $('#fc_rules');
    if (!fcRules.length) {
      fcRules = $('<style id="fc_rules"></style>').appendTo('head');
    }
    fcRules.text(!on ? '' : ' #tool_topath { display: none !important; }');
    $('#star_panel').toggle(on);
  }

  /*
  function toggleSourceButtons(on){
    $('#star_save, #star_cancel').toggle(on);
  }
  */

  function setAttr (attr, val) {
    svgCanvas.changeSelectedAttribute(attr, val);
    S.call('changed', selElems);
  }

  /*
  function cot(n){
    return 1 / Math.tan(n);
  }

  function sec(n){
    return 1 / Math.cos(n);
  }
  */

  return {
    name: 'star',
    svgicons: svgEditor.curConfig.extIconsPath + 'star-icons.svg',
    buttons: [{
      id: 'tool_star',
      type: 'mode',
      title: 'Star Tool',
      position: 12,
      events: {
        click () {
          showPanel(true);
          svgCanvas.setMode('star');
        }
      }
    }],

    context_tools: [{
      type: 'input',
      panel: 'star_panel',
      title: 'Number of Sides',
      id: 'starNumPoints',
      label: 'points',
      size: 3,
      defval: 5,
      events: {
        change () {
          setAttr('point', this.value);
        }
      }
    }, {
      type: 'input',
      panel: 'star_panel',
      title: 'Pointiness',
      id: 'starRadiusMulitplier',
      label: 'Pointiness',
      size: 3,
      defval: 2.5
    }, {
      type: 'input',
      panel: 'star_panel',
      title: 'Twists the star',
      id: 'radialShift',
      label: 'Radial Shift',
      size: 3,
      defval: 0,
      events: {
        change () {
          setAttr('radialshift', this.value);
        }
      }
    }],
    callback () {
      $('#star_panel').hide();
      // const endChanges = function(){};
    },
    mouseDown (opts) {
      const rgb = svgCanvas.getColor('fill');
      // const ccRgbEl = rgb.substring(1, rgb.length);
      const sRgb = svgCanvas.getColor('stroke');
      // const ccSRgbEl = sRgb.substring(1, rgb.length);
      const sWidth = svgCanvas.getStrokeWidth();

      if (svgCanvas.getMode() === 'star') {
        started = true;

        newFO = S.addSvgElementFromJson({
          element: 'polygon',
          attr: {
            cx: opts.start_x,
            cy: opts.start_y,
            id: S.getNextId(),
            shape: 'star',
            point: document.getElementById('starNumPoints').value,
            r: 0,
            radialshift: document.getElementById('radialShift').value,
            r2: 0,
            orient: 'point',
            fill: rgb,
            strokecolor: sRgb,
            strokeWidth: sWidth
          }
        });
        return {
          started: true
        };
      }
    },
    mouseMove (opts) {
      if (!started) {
        return;
      }
      if (svgCanvas.getMode() === 'star') {
        const c = $(newFO).attr(['cx', 'cy', 'point', 'orient', 'fill', 'strokecolor', 'strokeWidth', 'radialshift']);

        let x = opts.mouse_x;
        let y = opts.mouse_y;
        const {cx, cy, fill, strokecolor, strokeWidth, radialShift, point, orient} = c,
          circumradius = (Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy))) / 1.5,
          inradius = circumradius / document.getElementById('starRadiusMulitplier').value;
        newFO.setAttributeNS(null, 'r', circumradius);
        newFO.setAttributeNS(null, 'r2', inradius);

        let polyPoints = '';
        for (let s = 0; point >= s; s++) {
          let angle = 2.0 * Math.PI * (s / point);
          if (orient === 'point') {
            angle -= (Math.PI / 2);
          } else if (orient === 'edge') {
            angle = (angle + (Math.PI / point)) - (Math.PI / 2);
          }

          x = (circumradius * Math.cos(angle)) + cx;
          y = (circumradius * Math.sin(angle)) + cy;

          polyPoints += x + ',' + y + ' ';

          if (inradius != null) {
            angle = (2.0 * Math.PI * (s / point)) + (Math.PI / point);
            if (orient === 'point') {
              angle -= (Math.PI / 2);
            } else if (orient === 'edge') {
              angle = (angle + (Math.PI / point)) - (Math.PI / 2);
            }
            angle += radialShift;

            x = (inradius * Math.cos(angle)) + cx;
            y = (inradius * Math.sin(angle)) + cy;

            polyPoints += x + ',' + y + ' ';
          }
        }
        newFO.setAttributeNS(null, 'points', polyPoints);
        newFO.setAttributeNS(null, 'fill', fill);
        newFO.setAttributeNS(null, 'stroke', strokecolor);
        newFO.setAttributeNS(null, 'stroke-width', strokeWidth);
        /* const shape = */ newFO.getAttributeNS(null, 'shape');

        return {
          started: true
        };
      }
    },
    mouseUp () {
      if (svgCanvas.getMode() === 'star') {
        const attrs = $(newFO).attr(['r']);
        // svgCanvas.addToSelection([newFO], true);
        return {
          keep: (attrs.r !== '0'),
          element: newFO
        };
      }
    },
    selectedChanged (opts) {
      // Use this to update the current selected elements
      selElems = opts.elems;

      let i = selElems.length;
      while (i--) {
        const elem = selElems[i];
        if (elem && elem.getAttributeNS(null, 'shape') === 'star') {
          if (opts.selectedElement && !opts.multiselected) {
            // $('#starRadiusMulitplier').val(elem.getAttribute('r2'));
            $('#starNumPoints').val(elem.getAttribute('point'));
            $('#radialShift').val(elem.getAttribute('radialshift'));
            showPanel(true);
          } else {
            showPanel(false);
          }
        } else {
          showPanel(false);
        }
      }
    },
    elementChanged (opts) {
      // const elem = opts.elems[0];
    }
  };
});