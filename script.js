(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, c) {
    return (c || document).querySelector(s);
  };
  var $$ = function (s, c) {
    return Array.prototype.slice.call((c || document).querySelectorAll(s));
  };
  $("#year").textContent = new Date().getFullYear();

  // If a linked photo fails to load, keep the neutral placeholder colour instead of a broken icon
  $$("img").forEach(function (img) {
    img.addEventListener("error", function () {
      img.classList.add("broken");
    });
    if (img.complete && img.naturalWidth === 0) img.classList.add("broken");
  });

  // Header shadow + back-to-top
  var header = $(".nav"),
    totop = $(".totop");
  function onScroll() {
    header.classList.toggle("scrolled", window.scrollY > 8);
    totop.classList.toggle("show", window.scrollY > 600);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  totop.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  });

  // Mobile menu (panel opens right under the header, wherever the page is scrolled)
  var btn = $(".menu-btn"),
    menu = $("#menu"),
    scrim = $(".scrim");
  function setMenu(open) {
    if (open)
      document.documentElement.style.setProperty(
        "--menu-top",
        Math.max(0, header.getBoundingClientRect().bottom) + "px",
      );
    menu.classList.toggle("open", open);
    scrim.classList.toggle("show", open);
    document.body.classList.toggle("no-scroll", open);
    btn.setAttribute("aria-expanded", String(open));
    btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }
  btn.addEventListener("click", function () {
    setMenu(!menu.classList.contains("open"));
  });
  scrim.addEventListener("click", function () {
    setMenu(false);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && menu.classList.contains("open")) {
      setMenu(false);
      btn.focus();
    }
  });
  window.addEventListener("resize", function () {
    if (window.innerWidth > 860) setMenu(false);
  });

  // Smooth scrolling for in-page links
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var t = $(a.getAttribute("href"));
      if (!t) return;
      e.preventDefault();
      setMenu(false);
      t.scrollIntoView({
        behavior: reduce ? "auto" : "smooth",
        block: "start",
      });
      history.pushState(null, "", a.getAttribute("href"));
    });
  });

  // Hero slider
  var slides = $$(".slide"),
    dotsBox = $(".dots"),
    kicker = $("#kicker"),
    hero = $(".hero");
  var labels = [
      "Child education & women’s empowerment",
      "Child education & women’s empowerment",
      "Child education & women’s empowerment",
    ],
    cur = 0,
    timer = null;
  slides.forEach(function (s, i) {
    var d = document.createElement("button");
    d.type = "button";
    d.setAttribute("aria-label", "Go to slide " + (i + 1));
    d.addEventListener("click", function () {
      go(i);
      play();
    });
    dotsBox.appendChild(d);
  });
  var dots = $$("button", dotsBox);
  function go(n) {
    cur = (n + slides.length) % slides.length;
    slides.forEach(function (s, i) {
      s.classList.toggle("active", i === cur);
    });
    dots.forEach(function (d, i) {
      d.setAttribute("aria-current", String(i === cur));
    });
    kicker.textContent = labels[cur];
  }
  function play() {
    clearInterval(timer);
    if (!reduce)
      timer = setInterval(function () {
        go(cur + 1);
      }, 5500);
  }
  $(".prev").addEventListener("click", function () {
    go(cur - 1);
    play();
  });
  $(".next").addEventListener("click", function () {
    go(cur + 1);
    play();
  });
  hero.addEventListener("mouseenter", function () {
    clearInterval(timer);
  });
  hero.addEventListener("mouseleave", play);
  var x0 = null;
  hero.addEventListener(
    "touchstart",
    function (e) {
      x0 = e.touches[0].clientX;
    },
    { passive: true },
  );
  hero.addEventListener("touchend", function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) {
      go(cur + (dx < 0 ? 1 : -1));
      play();
    }
    x0 = null;
  });
  document.addEventListener("visibilitychange", function () {
    document.hidden ? clearInterval(timer) : play();
  });
  go(0);
  play();

  // Highlight current section in the menu
  if ("IntersectionObserver" in window) {
    var links = $$("#menu a");
    var spy = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting)
            links.forEach(function (l) {
              l.classList.toggle(
                "active",
                l.getAttribute("href") === "#" + en.target.id,
              );
            });
        });
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    ["about", "work", "where", "donate"].forEach(function (id) {
      spy.observe($("#" + id));
    });
  }

  // Scroll reveal + count-up
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add("in");
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.05, rootMargin: "0px 0px 8% 0px" },
    );
    [
      ".two > div, .two > figure, .two > .mapbox, .two > form",
      ".title.center, .lead",
      ".tile",
      ".scard",
      ".goals li",
      ".foot-grid > div",
    ].forEach(function (sel) {
      $$(sel).forEach(function (el, i) {
        el.classList.add("reveal");
        el.style.setProperty("--d", (i % 4) * 0.1 + "s");
        io.observe(el);
      });
    });
    var co = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          co.unobserve(en.target);
          var el = en.target,
            end = Number(el.dataset.count),
            suf = el.dataset.suffix || "",
            t0 = null;
          (function step(t) {
            if (!t0) t0 = t;
            var p = Math.min((t - t0) / 1600, 1),
              e = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(end * e).toLocaleString("en-IN") + suf;
            if (p < 1) requestAnimationFrame(step);
          })(performance.now());
        });
      },
      { threshold: 0.6 },
    );
    $$("[data-count]").forEach(function (c) {
      co.observe(c);
    });
  }

  // Map pins <-> region buttons highlight each other
  var linked = $$(".pin, .region button");
  function hl(name, on) {
    linked.forEach(function (el) {
      if (el.dataset.state === name) el.classList.toggle("active", on);
    });
  }
  linked.forEach(function (el) {
    ["mouseenter", "focus"].forEach(function (ev) {
      el.addEventListener(ev, function () {
        hl(el.dataset.state, true);
      });
    });
    ["mouseleave", "blur"].forEach(function (ev) {
      el.addEventListener(ev, function () {
        hl(el.dataset.state, false);
      });
    });
    el.addEventListener("click", function () {
      linked.forEach(function (x) {
        x.classList.remove("active");
      });
      hl(el.dataset.state, true);
    });
  });

  // Donation / volunteer form (demo only – nothing is sent)
  var form = $("#donation-form"),
    role = $("#role"),
    amount = $("#amount"),
    amountWrap = $("#amount-wrap");
  var nameF = $("#name"),
    email = $("#email"),
    err = $("#form-error"),
    ok = $("#form-success"),
    submit = $("#submit-btn");
  var chips = $$(".chips button");
  function markChip() {
    chips.forEach(function (c) {
      c.setAttribute("aria-pressed", String(c.dataset.amt === amount.value));
    });
  }
  chips.forEach(function (c) {
    c.addEventListener("click", function () {
      amount.value = c.dataset.amt;
      markChip();
    });
  });
  amount.addEventListener("input", markChip);
  function syncRole() {
    var donating = role.value === "donate";
    amountWrap.hidden = !donating;
    amount.disabled = !donating;
    if (!donating) {
      amount.value = "";
      markChip();
    }
    submit.textContent = donating ? "Donate now" : "Sign up to volunteer";
  }
  role.addEventListener("change", syncRole);
  syncRole();
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    ok.hidden = err.hidden = true;
    [amount, nameF, email].forEach(function (f) {
      f.classList.remove("invalid");
    });
    var problems = [];
    if (role.value === "donate" && !(Number(amount.value) > 0)) {
      amount.classList.add("invalid");
      problems.push("Enter a donation amount greater than 0.");
    }
    if (nameF.value.trim().length < 2) {
      nameF.classList.add("invalid");
      problems.push("Enter your full name.");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
      email.classList.add("invalid");
      problems.push("Enter a valid email address.");
    }
    if (problems.length) {
      err.textContent = problems.join(" ");
      err.hidden = false;
      return;
    }
    var first = nameF.value.trim().split(" ")[0];
    ok.textContent =
      role.value === "donate"
        ? "Thank you, " +
          first +
          "! Your pledge of ₹" +
          Number(amount.value).toLocaleString("en-IN") +
          " has been noted."
        : "Thank you, " +
          first +
          "! We’ll email you about volunteer opportunities.";
    ok.hidden = false;
    form.reset();
    syncRole();
    markChip();
  });
})();
