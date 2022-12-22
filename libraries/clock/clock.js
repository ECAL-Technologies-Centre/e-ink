/*Version 0.1*/

"use strict";

const Clock = (function () {
  const config = {
    location: "https://ecal-technologies-centre.github.io",
  };

  const o = {
      date: new Date(),
      trueTime: false,
      fontSrc: `${config.location}/e-ink/libraries/clock/rsrc/font.png`,
    };
  const dom = {};

  window.addEventListener(
    "load",
    function () {
      dom.cssStyle = document.querySelector('link[href*="clock_style.css"]');

      if (!dom.cssStyle) {
        const link = (dom.cssStyle = document.createElement("link"));
        link.type = "text/css";
        link.rel = "stylesheet";
        link.href = `${config.location}/e-ink/libraries/clock/clock_style.css`;
        document.querySelector("head").appendChild(link);
      }

      dom.clock = document.querySelector(".clock");

      if (!dom.clock) {
        const tpl = document.createElement("template");
        tpl.innerHTML = `<section class="clock hidden"><div class="display"><input type="text" name="Hour" min="0" max="23" value="00" data-old="00">:<input type="text" name="Minute" min="0" max="59" value="00" data-old="00">:<input type="text" name="Second" min="0" max="59" value="00" data-old="00"></div></section>`;
        document.body.appendChild(tpl.content);
        dom.clock = document.querySelector(".clock");
      }

      dom.display = dom.clock.querySelector(".display");
      dom.Hour = dom.clock.querySelector('[name="Hour"]');
      dom.Minute = dom.clock.querySelector('[name="Minute"]');
      dom.Second = dom.clock.querySelector('[name="Second"]');

      const MOUSE = {
        pressTarg: 0,
        offsetX: 0,
        oldValue: 0,
        valueChanged: 0,
      };

      dom.clock.addEventListener("mousedown", function (e) {
        MOUSE.pressTarg = e.target;
        MOUSE.offsetX = e.clientX - e.target.offsetLeft;
        MOUSE.oldValue = e.target.dataset.old;
      });

      dom.clock.addEventListener("mouseup", function (e) {
        if (dom.clock === MOUSE.pressTarg && e.target === dom.clock)
          toggleDisplay(e.target);

        if (
          !MOUSE.valueChanged &&
          MOUSE.pressTarg === e.target &&
          e.target.tagName === "INPUT"
        ) {
          e.target.value = "";
        } else {
          MOUSE.pressTarg.blur();
        }

        MOUSE.pressTarg = MOUSE.valueChanged = 0;
      });

      dom.clock.addEventListener("mousemove", function (e) {
        if (MOUSE.pressTarg && MOUSE.pressTarg.tagName === "INPUT")
          changeValue(e.clientX);
      });

      dom.clock.addEventListener("focusout", function (e) {
        if (e.target.tagName === "INPUT") saveState(e.target);
      });

      dom.clock.addEventListener("input", function (e) {
        if (e.target.tagName === "INPUT") constrainValue(e.target);
      });

      document.addEventListener("keydown", function (e) {
        switch (e.key) {
          case "Enter":
          case "Tab":
            if (!dom.display.contains(e.target)) return;

            if (e.target.value) e.target.dataset.old = e.target.value;

            e.target.blur();
            break;

          case "Escape":
            if (dom.display.contains(e.target)) e.target.blur();
            else toggleDisplay(e.target);
        }
      });

      function changeValue(mouseX) {
        let max = parseInt(MOUSE.pressTarg.max),
          pos = mouseX - MOUSE.pressTarg.offsetLeft - MOUSE.offsetX,
          n = parseInt(MOUSE.oldValue) + (pos / window.innerWidth) * max;

        n = (n + max) % max;

        MOUSE.pressTarg.dataset.old = leadZero(Math.round(n));

        if (MOUSE.oldValue !== MOUSE.pressTarg.dataset.old)
          MOUSE.valueChanged = 1;

        return saveState(MOUSE.pressTarg);
      }

      function constrainValue(target) {
        target.value = target.value.replace(/[^0-9]/g, "");

        return (target.value = target.value.substr(target.value.length - 2));
      }

      function saveState(target) {
        let t = Math.min(parseInt(target.dataset.old), parseInt(target.max));
        target.value = t = leadZero(t);

        Clock[`set${target.name}s`](t);
        Clock.tick(0);

        return t;
      }

      function toggleDisplay(target) {
        return dom.clock.classList.toggle("hidden");
      }
    },
    { useCapture: true, once: true }
  );

  const handler = {
    date: o.date,
    dom: dom,

    _time: {
      Hour: o.date.getHours(),
      Minute: o.date.getMinutes(),
      Second: o.date.getSeconds(),
    },

    fontDims: {
      ":": [0, 2],
      0: [1, 6],
      1: [2, 6],
      2: [3, 6],
      3: [4, 6],
      4: [5, 6],
      5: [6, 6],
      6: [7, 6],
      7: [8, 6],
      8: [9, 6],
      9: [10, 6],
    },

    fontImg: (function () {
      let img = new Image();
      img.crossOrigin = "anonymous";
      img.src = o.fontSrc;
      return img;
    })(),

    trueTime: o.trueTime,

    _fetched: new Date(),

    get(target, method) {
      return function (...args) {
        if (this.trueTime) {
          this.updateDate();
          this.compare();
        }

        if (this.customMethods.hasOwnProperty(method)) {
          return this.customMethods[method].call(this, ...args);
        } else {
          return this.date[method].apply(this.date, args);
        }
      }.bind(this);
    },

    set(target, method, value) {
      return (this.customMethods[method] = value);
    },

    customMethods: {
      onMinuteChange: function () {},
      onSecondChange: function () {},
      onHourChange: function () {},

      init(options = {}) {
        for (const opt in options) {
          this[opt] = options[opt];
        }
      },

      tick(amt = 1000) {
        if (!this.trueTime) {
          this.date.setTime(this.date.getTime() + amt);
          this.compare();
        }

        return this.date;
      },

      display(options) {
        const o = {
          black: false,
          context: window.drawingContext,
          scale: 2,
        };
        
        if(o.context instanceof WebGLRenderingContext) return;

        Object.assign(o, options);

        let c = o.context,
          text = this.date.toLocaleTimeString("en-GB"),
          height = this.fontImg.height,
          width = 7,
          space = 0,
          scale = Math.ceil(o.scale);

        c.save();

        c.imageSmoothingEnabled = false;
        c.globalCompositeOperation = "source-over";
        c.filter = o.black ? "invert(100%)" : "none";

        c.resetTransform();
        c.scale(scale, scale);
        c.translate(0, 0);

        for (let i = 0; i < text.length; i++) {
          let char = text[i],
            map = this.fontDims[char];

          c.drawImage(
            this.fontImg,
            map[0] * width,
            0,
            width,
            height,
            space,
            0,
            width,
            height
          );

          space += map[1];
        }

        c.restore();
      },
    },

    /*private Methods*/

    compare() {
      for (let key in this._time) {
        let value = this.date[`get${key}s`]();

        let currDom = this.dom[key];

        if (currDom && document.activeElement !== currDom)
          currDom.value = this.dom[key].dataset.old = leadZero(value);

        if (value !== this._time[key]) {
          this._time[key] = value;

          this.customMethods[`on${key}Change`].call(this.date, {
            value: value,
          });
        }
      }
    },

    updateDate() {
      let now = new Date(),
        offset = now.getTime() - this._fetched.getTime();

      this.date.setTime(this.date.getTime() + offset);
      this._fetched = now;

      return this.date;
    },
  };

  function leadZero(n) {
    return n > 9 ? "" + n : "0" + n;
  }

  return (dom.time = new Proxy(o.date, handler));
})();
