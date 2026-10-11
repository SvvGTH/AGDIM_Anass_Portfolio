// Scripts partagés par la version française (/) et anglaise (/en/).
// La langue est lue sur <html lang="...">.
(function () {
  var EN = (document.documentElement.lang || "fr").slice(0, 2) === "en";

  var T = EN ? {
    toDark: "Switch to dark theme", toLight: "Switch to light theme",
    copied: "Address copied.", copyFail: "Copying isn’t available here. The address is: ",
    rawThenPrior: "Raw score, then after the numbering plan:",
    poses: {
      upright: { status: ["ok", "Written to the record"], why: "Easy case: only one plausible reading, with high confidence." },
      flipped: { status: ["ok", "Written, line order fixed"], why: "Upside down, the model hesitates between the two line orders and even prefers the wrong one. The numbering plan, where a leading 1 is far more common than a leading 3, tips the decision the right way." },
      turned: { status: ["ok", "Written to the record"], why: "The orientation classifier detects the rotation and straightens the photo before reading." },
      dirty: { status: ["hold", "Handed back to the agent"], why: "Mud hides two digits. Instead of guessing, the reader lets the agent type the number: a wrong number in the database costs more than a manual entry." }
    }
  } : {
    toDark: "Passer en thème sombre", toLight: "Passer en thème clair",
    copied: "Adresse copiée.", copyFail: "Copie impossible ici. L’adresse : ",
    rawThenPrior: "Score brut, puis après le plan de numérotation :",
    poses: {
      upright: { status: ["ok", "Écrit dans la fiche"], why: "Cas simple : une seule lecture plausible, avec une confiance élevée." },
      flipped: { status: ["ok", "Écrit dans la fiche, ordre corrigé"], why: "À l’envers, le modèle hésite entre les deux ordres des lignes et préfère même le mauvais. Le plan de numérotation, qui rend un 1 en tête bien plus fréquent qu’un 3, fait pencher la décision du bon côté." },
      turned: { status: ["ok", "Écrit dans la fiche"], why: "Le classifieur d’orientation détecte la rotation et redresse la photo avant la lecture." },
      dirty: { status: ["hold", "Rendu à l’agent"], why: "Deux chiffres sont masqués par la boue. Plutôt que deviner, le lecteur laisse l’agent saisir le numéro : une erreur dans la base coûte plus qu’une saisie." }
    }
  };

  // Thème clair / sombre
  (function () {
    var root = document.documentElement, btn = document.getElementById("theme");
    if (!btn) return;
    function current() { return root.getAttribute("data-theme") || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"); }
    function label() { btn.setAttribute("aria-label", current() === "dark" ? T.toLight : T.toDark); }
    label();
    btn.addEventListener("click", function () {
      var next = current() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) {}
      label();
    });
  })();

  // Démonstration du lecteur de boucle
  (function () {
    var reader = document.getElementById("reader");
    if (!reader) return;
    var body = document.getElementById("tagbody");
    var out = document.getElementById("v-read"), st = document.getElementById("v-status");
    var why = document.getElementById("v-why"), cands = document.getElementById("v-cands");
    var poses = {
      upright: { rot: "rotate(0deg)", read: "10623917", list: [] },
      flipped: { rot: "rotate(180deg)", read: "10623917",
        list: [["39171062", 52, "lose"], ["10623917", 48, "win"]],
        after: [["39171062", 37, "lose"], ["10623917", 63, "win"]] },
      turned: { rot: "rotate(-90deg)", read: "10623917", list: [] },
      dirty: { rot: "rotate(0deg)", read: "10?2391?", list: [] }
    };
    function bars(list) {
      cands.innerHTML = "";
      list.forEach(function (c) {
        var row = document.createElement("div");
        row.className = "cand " + c[2];
        row.innerHTML = '<span class="num">' + c[0] + '</span><span class="bar"><i></i></span><span class="num">' + c[1] + ' %</span>';
        cands.appendChild(row);
        requestAnimationFrame(function () { requestAnimationFrame(function () { row.querySelector("i").style.width = c[1] + "%"; }); });
      });
    }
    function show(name) {
      var p = poses[name], txt = T.poses[name];
      reader.setAttribute("data-state", name);
      body.style.transform = p.rot;
      reader.classList.remove("reading"); void reader.offsetWidth; reader.classList.add("reading");
      document.querySelectorAll(".poses button").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.pose === name ? "true" : "false"); });
      out.textContent = p.read;
      st.className = "status " + txt.status[0]; st.textContent = txt.status[1];
      why.textContent = txt.why;
      bars(p.list);
      if (p.after) {
        var hdr = document.createElement("p"); hdr.className = "why"; hdr.textContent = T.rawThenPrior;
        cands.prepend(hdr);
        setTimeout(function () {
          if (reader.getAttribute("data-state") !== name) return;
          var rows = cands.querySelectorAll(".cand");
          p.after.forEach(function (c, i) { rows[i].querySelector("i").style.width = c[1] + "%"; rows[i].lastChild.textContent = c[1] + " %"; });
        }, 1100);
      }
    }
    document.querySelectorAll(".poses button").forEach(function (b) { b.addEventListener("click", function () { show(b.dataset.pose); }); });
  })();

  // Copier l'adresse
  (function () {
    var btn = document.getElementById("copy"), out = document.getElementById("copied");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var mail = btn.getAttribute("data-email");
      function ok() { out.textContent = T.copied; }
      function ko() { out.textContent = T.copyFail + mail; }
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(mail).then(ok, ko); else ko();
    });
  })();

  // Lien actif dans la navigation
  (function () {
    var links = [].slice.call(document.querySelectorAll(".top nav a[href^='#']"));
    if (!("IntersectionObserver" in window)) return;
    var map = {}; links.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting && map[e.target.id]) {
          links.forEach(function (l) { l.removeAttribute("aria-current"); });
          map[e.target.id].setAttribute("aria-current", "true");
        }
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
  })();
})();
