/* ============================================================
   こかげ整体院 — スクリプト（依存ライブラリなし）
   1. Cal.com 予約カレンダーの遅延読み込み（マニュアル7-3方式）
   2. ハンバーガーメニュー・スクロール出現・固定CTA
   ============================================================ */
(function () {
  'use strict';

  /* ============================================================
     予約カレンダー設定
     ------------------------------------------------------------
     本番化の手順:
     1. クライアントに Cal.com アカウントを作成してもらう
        （イベントタイプ例: 初回体験 60分）
     2. 公開ページのリンク（例: kokage-seitai/trial）を
        下の CAL_LINK に設定する
     3. それだけで、デモ用カレンダーの代わりに本物の
        Cal.com 予約カレンダーがこの位置に表示されます
     ============================================================ */
  var CAL_LINK = '';          // 例: 'kokage-seitai/trial'（空のままだとデモ表示）
  var CAL_BRAND = '#2F5D46';  // 埋め込みカレンダーのテーマカラー（LPの深緑に合わせる）

  var calEmbed = document.getElementById('calEmbed');
  var fallbackLink = document.getElementById('calFallbackLink');

  // 本物のCal.com埋め込みを読み込む（公式スニペット方式）
  function loadCalEmbed() {
    /* Cal.com 公式埋め込みローダー */
    (function (C, A, L) {
      var p = function (a, ar) { a.q.push(ar); };
      var d = C.document;
      C.Cal = C.Cal || function () {
        var cal = C.Cal, ar = arguments;
        if (!cal.loaded) {
          cal.ns = {}; cal.q = cal.q || [];
          var s = d.createElement('script'); s.src = A; s.async = true;
          d.head.appendChild(s);
          cal.loaded = true;
        }
        if (ar[0] === L) {
          var api = function () { p(api, arguments); };
          var namespace = ar[1];
          api.q = api.q || [];
          if (typeof namespace === 'string') { cal.ns[namespace] = api; p(api, ar); }
          else { p(cal, ar); }
          return;
        }
        p(cal, ar);
      };
    })(window, 'https://app.cal.com/embed/embed.js', 'init');

    window.Cal('init', { origin: 'https://cal.com' });
    window.Cal('inline', {
      elementOrSelector: '#calEmbed',
      calLink: CAL_LINK,
      config: { theme: 'light' }
    });
    window.Cal('ui', { styles: { branding: { brandColor: CAL_BRAND } }, hideEventTypeDetails: false });

    fallbackLink.href = 'https://cal.com/' + CAL_LINK;
  }

  // デモ用プレースホルダーカレンダーを描画（CAL_LINK未設定時）
  function renderDemoCalendar() {
    var now = new Date();
    var year = now.getFullYear();
    var month = now.getMonth(); // 0始まり
    var first = new Date(year, month, 1).getDay();
    var days = new Date(year, month + 1, 0).getDate();
    var dows = ['日', '月', '火', '水', '木', '金', '土'];

    var html = '<div class="cal-demo">';
    html += '<div class="cal-demo-head"><b>' + year + '年' + (month + 1) + '月の空き状況</b>';
    html += '<span class="cal-demo-badge">デモ表示</span></div>';
    html += '<div class="cal-demo-grid">';
    dows.forEach(function (d) { html += '<span class="dow">' + d + '</span>'; });
    for (var i = 0; i < first; i++) { html += '<span class="day is-off" aria-hidden="true"></span>'; }
    for (var day = 1; day <= days; day++) {
      var dow = new Date(year, month, day).getDay();
      var isPast = day <= now.getDate();
      var isClosed = dow === 0 || dow === 3; // 定休日: 日曜・水曜
      if (isPast || isClosed) {
        html += '<span class="day is-off">' + day + '</span>';
      } else {
        html += '<span class="day is-open" title="デモのため予約はできません">' + day + '</span>';
      }
    }
    html += '</div>';
    html += '<p class="cal-demo-note">本番ではここに Cal.com の予約カレンダーが表示され、<br>日時を選ぶとその場で予約確定・確認メールが自動送信されます。</p>';
    html += '</div>';
    calEmbed.innerHTML = html;
  }

  // セクション付近までスクロールしてから読み込む（初期表示速度を守る）
  function initBooking() {
    if (CAL_LINK) { loadCalEmbed(); } else { renderDemoCalendar(); }
  }
  if ('IntersectionObserver' in window) {
    calEmbed.classList.add('is-loading');
    calEmbed.textContent = '予約カレンダーを準備しています…';
    new IntersectionObserver(function (entries, obs) {
      if (!entries[0].isIntersecting) return;
      obs.disconnect();
      calEmbed.classList.remove('is-loading');
      initBooking();
    }, { rootMargin: '400px 0px' }).observe(calEmbed);
  } else {
    initBooking();
  }

  /* ---- ハンバーガーメニュー ---- */
  var menuBtn = document.getElementById('menuBtn');
  var gnav = document.getElementById('gnav');
  function closeMenu() {
    gnav.classList.remove('is-open');
    menuBtn.setAttribute('aria-expanded', 'false');
  }
  menuBtn.addEventListener('click', function () {
    var open = gnav.classList.toggle('is-open');
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  gnav.addEventListener('click', function (e) {
    if (e.target.closest('a')) closeMenu();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenu();
  });

  /* ---- スクロール出現アニメーション ---- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-shown');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -12% 0px' });
    reveals.forEach(function (n) { io.observe(n); });
  } else {
    reveals.forEach(function (n) { n.classList.add('is-shown'); });
  }

  /* ---- スマホ固定CTA（FV通過後に表示、予約セクションでは隠す） ---- */
  var fixedCta = document.getElementById('fixedCta');
  var fv = document.querySelector('.fv');
  var booking = document.getElementById('booking');
  if (fixedCta && fv && 'IntersectionObserver' in window) {
    var pastFv = false, inBooking = false;
    function updateCta() {
      var show = pastFv && !inBooking;
      fixedCta.classList.toggle('is-visible', show);
      fixedCta.setAttribute('aria-hidden', String(!show));
      fixedCta.querySelector('a').tabIndex = show ? 0 : -1;
    }
    new IntersectionObserver(function (entries) {
      pastFv = !entries[0].isIntersecting;
      updateCta();
    }, { threshold: 0.1 }).observe(fv);
    new IntersectionObserver(function (entries) {
      inBooking = entries[0].isIntersecting;
      updateCta();
    }, { threshold: 0.12 }).observe(booking);
  }
})();
