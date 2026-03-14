/* ============================================================================
 * 16) GM BUTTONS & NESTED HELP MENUS
 * ==========================================================================*/

function mb(label, cmd){ return button(label, cmd); }
function nav(label, page){ return button(label, 'help '+page); }

function _menuBox(title, innerHtml){
  return [
    '<div style="border:1px solid #555;border-radius:4px;padding:6px;margin:6px 0;">',
    '<div style="font-weight:bold;margin-bottom:4px;">', esc(title), '</div>',
    innerHtml,
    '</div>'
  ].join('');
}

function gmButtonsHtml(){
  var wrap = STYLES.gmbuttonWrap;
  var st = ensureSettings();
  // Row 1: day controls + send
  var row1 = [
    '<div style="'+wrap+'">'+ mb('⏮ Back','retreat 1')   +'</div>',
    '<div style="'+wrap+'">'+ mb('⏭ Forward','advance 1') +'</div>',
    '<div style="'+wrap+'">'+ mb('📣 Send','send')         +'</div>'
  ];
  // Row 2: today deep-dive + subsystems
  var row2 = [
    '<div style="'+wrap+'">'+ mb('📋 Today','today')       +'</div>'
  ];
  if (st.weatherEnabled !== false) row2.push('<div style="'+wrap+'">'+ mb('🌤 Weather','weather') +'</div>');
  if (st.moonsEnabled   !== false) row2.push('<div style="'+wrap+'">'+ mb('🌙 Moons','moon')     +'</div>');
  if (st.planesEnabled  !== false) row2.push('<div style="'+wrap+'">'+ mb('🌀 Planes','planes')   +'</div>');
  // Row 3: admin
  var row3 = [
    '<div style="'+wrap+'">'+ nav('⚙ Admin','root') +'</div>'
  ];
  return row1.join('') + '<br>' + row2.join('') + '<br>' + row3.join('');
}

function _activePlanarWeatherShiftLines(serial){
  var out = [];
  try {
    var eff = getActivePlanarEffects(serial);
    for (var i = 0; i < eff.length; i++){
      var e = eff[i];
      if (e.plane === 'Fernia' && e.phase === 'coterminous') out.push('Fernia coterminous: temperature +3');
      if (e.plane === 'Fernia' && e.phase === 'remote')      out.push('Fernia remote: temperature -2');
      if (e.plane === 'Risia'  && e.phase === 'coterminous') out.push('Risia coterminous: temperature -3');
      if (e.plane === 'Risia'  && e.phase === 'remote')      out.push('Risia remote: temperature +2');
      if (e.plane === 'Syrania'&& e.phase === 'coterminous') out.push('Syrania coterminous: clear and calm (precipitation 0, wind 0)');
      if (e.plane === 'Syrania'&& e.phase === 'remote')      out.push('Syrania remote: precipitation +1');
      if (e.plane === 'Mabar'  && e.phase === 'coterminous') out.push('Mabar coterminous: temperature -1');
      if (e.plane === 'Irian'  && e.phase === 'coterminous') out.push('Irian coterminous: temperature +1');
      if (e.plane === 'Lamannia'&& e.phase === 'coterminous')out.push('Lamannia coterminous: precipitation +1');
    }
  } catch(e2){}
  return out;
}

function _planarWeatherInfluenceText(e){
  if (!e) return null;
  if (e.plane === 'Fernia' && e.phase === 'coterminous') return '🔥 Fernia coterminous (+3 temp)';
  if (e.plane === 'Fernia' && e.phase === 'remote')      return '🔥 Fernia remote (-2 temp)';
  if (e.plane === 'Risia'  && e.phase === 'coterminous') return '❄️ Risia coterminous (-3 temp)';
  if (e.plane === 'Risia'  && e.phase === 'remote')      return '❄️ Risia remote (+2 temp)';
  if (e.plane === 'Syrania'&& e.phase === 'coterminous') return '🌤 Syrania coterminous (clear, calm)';
  if (e.plane === 'Syrania'&& e.phase === 'remote')      return '🌧 Syrania remote (+1 precip)';
  if (e.plane === 'Mabar'  && e.phase === 'coterminous') return '🌑 Mabar coterminous (-1 temp)';
  if (e.plane === 'Irian'  && e.phase === 'coterminous') return '✨ Irian coterminous (+1 temp)';
  if (e.plane === 'Lamannia'&& e.phase === 'coterminous')return '🌿 Lamannia coterminous (+1 precip)';
  return null;
}

function _weatherInfluenceTexts(rec){
  var out = [];
  if (!rec) return out;
  var zoneEntries = _activeManifestZonesForSerial(rec.serial);
  for (var zi = 0; zi < zoneEntries.length; zi++){
    var mzText = _manifestZoneInfluenceText(zoneEntries[zi].def);
    if (mzText) out.push(mzText);
  }
  try {
    var eff = getActivePlanarEffects(rec.serial);
    for (var i = 0; i < eff.length; i++){
      var pText = _planarWeatherInfluenceText(eff[i]);
      if (pText) out.push(pText);
    }
  } catch(e2){}
  if (_isZarantyrFull(rec.serial)) out.push('🌙 Zarantyr full (lightning boost)');
  return out;
}

function _weatherInfluenceHtml(rec){
  var lines = _weatherInfluenceTexts(rec);
  if (!lines.length) return '';
  return '<div style="font-size:.76em;opacity:.58;font-style:italic;margin-top:3px;">'+
    lines.map(esc).join(' · ')+
    '</div>';
}

function activeEffectsPanelHtml(){
  var st = ensureSettings();
  var today = todaySerial();
  var sections = [];

  // Weather mechanics (today, current location only)
  if (st.weatherEnabled !== false){
    var wx = '';
    try {
      var ws = getWeatherState();
      if (!ws.location){
        wx = '<div style="opacity:.7;">No weather location set.</div>';
      } else {
        weatherEnsureForecast();
        var rec = _weatherRecordForDisplay(_forecastRecord(today));
        if (!rec || !rec.final){
          wx = '<div style="opacity:.7;">No weather generated for today.</div>';
        } else {
          var loc = rec.location || ws.location || {};
          var locLine = esc(titleCase(loc.climate||'')) + ' / ' +
            esc(titleCase(String(loc.geography||'inland').replace(/_/g,' '))) + ' / ' +
            esc(titleCase(loc.terrain||'open'));
          var cond = _deriveConditions(
            rec.final,
            loc,
            WEATHER_PRIMARY_PERIOD,
            rec.snowAccumulated,
            _weatherPrimaryFog(rec)
          );
          var narr = _conditionsNarrative(rec.final, cond, WEATHER_PRIMARY_PERIOD);
          wx += '<div style="font-size:.85em;opacity:.75;">'+locLine+'</div>';
          var manifestStatus = _manifestZoneStatusLabel(_activeManifestZoneEntries());
          if (manifestStatus !== 'None'){
            wx += '<div style="font-size:.82em;opacity:.68;margin-top:2px;">Manifest zones: '+esc(manifestStatus)+'</div>';
          }
          wx += '<div style="margin:3px 0;">' +
            _weatherTraitBadge('temp',   rec.final.temp)+'&nbsp;' +
            _weatherTraitBadge('wind',   rec.final.wind)+'&nbsp;' +
            _weatherTraitBadge('precip', rec.final.precip) +
            '</div>';
          wx += '<div style="font-size:.85em;opacity:.85;">'+esc(narr)+'</div>';
          wx += _conditionsMechHtml(cond);
          if (st.weatherMechanicsEnabled === false){
            wx += '<div style="font-size:.8em;opacity:.6;margin-top:3px;">Mechanical weather effects are disabled.</div>';
          }

          var shifts = _activePlanarWeatherShiftLines(today);
          if (shifts.length){
            wx += '<div style="font-size:.82em;opacity:.85;margin-top:4px;"><b>Planar weather shifts:</b><br>' +
              shifts.map(esc).join('<br>') + '</div>';
          }

          var geo = String((loc.geography || 'inland')).toLowerCase();
          if (geo === 'coastal' || geo === 'island' || geo === 'coastal_bluff'){
            try {
              var tidx = getTidalIndex(today);
              wx += '<div style="font-size:.82em;opacity:.8;margin-top:4px;">🌊 <b>Tides:</b> '+esc(tidalLabel(tidx))+' ('+tidx+'/10)</div>';
            } catch(e3){}
          }
        }
      }
    } catch(e4){
      wx = '<div style="opacity:.7;">Weather data unavailable.</div>';
    }
    sections.push(_menuBox('🌤️ Active Weather Effects', wx));
  }

  // Planar mechanics (active coterminous/remote, filtered for non-routine signal)
  if (st.planesEnabled !== false){
    var pl = '';
    try {
      var planes = _getAllPlaneData();
      var ypd = _planarYearDays();
      var rows = [];
      for (var i = 0; i < planes.length; i++){
        var ps = getPlanarState(planes[i].name, today);
        if (!ps) continue;
        if (ps.phase !== 'coterminous' && ps.phase !== 'remote') continue;

        // Skip permanently fixed routine states (e.g., Dal Quor/Xoriat) unless generated.
        var isGenerated = _isGeneratedNote(ps.note);
        if (planes[i].type === 'fixed' && !isGenerated) continue;

        // Skip extremely long routine phases unless forced or generated.
        if (ps.phaseDuration != null && ps.phaseDuration > ypd && !ps.overridden && !isGenerated) continue;

        var emoji = PLANE_PHASE_EMOJI[ps.phase] || '⚪';
        var lbl = PLANE_PHASE_LABELS[ps.phase] || ps.phase;
        var next = (ps.daysUntilNextPhase != null && ps.nextPhase)
          ? ' <span style="opacity:.55;font-size:.82em;">(' + esc(PLANE_PHASE_LABELS[ps.nextPhase] || ps.nextPhase) + ' in ' + ps.daysUntilNextPhase + 'd)</span>'
          : '';
        var row = '<div style="margin:3px 0;">'+emoji+' <b>'+esc(ps.plane.name)+'</b> — '+esc(lbl)+next+'</div>';
        var eff = (ps.plane.effects && ps.plane.effects[ps.phase]) || '';
        if (eff){
          row += '<div style="font-size:.82em;opacity:.78;margin-left:14px;">'+esc(eff)+'</div>';
        }
        rows.push(row);
      }

      if (!rows.length){
        pl = '<div style="opacity:.7;">No notable coterminous/remote planar effects are active today.</div>';
      } else {
        pl = rows.join('');
      }

      // Long Shadows spotlight
      try {
        var mabar = getPlanarState('Mabar', today);
        if (mabar && mabar.phase === 'coterminous'){
          var cc = getCal().current;
          var ls = getLongShadowsMoons(cc.year);
          if (ls.length){
            var names = [];
            for (var li = 0; li < ls.length; li++) names.push(ls[li].name);
            pl += '<div style="font-size:.82em;margin-top:4px;padding:4px;background:rgba(60,0,80,.15);border-radius:3px;border:1px solid rgba(100,50,120,.3);">🌑 <b>Long Shadows:</b> '+esc(names.join(', '))+' dark tonight.</div>';
          }
        }
      } catch(e5){}
    } catch(e6){
      pl = '<div style="opacity:.7;">Planar data unavailable.</div>';
    }
    sections.push(_menuBox('🌀 Active Planar Effects', pl));
  }

  if (!sections.length){
    sections.push('<div style="opacity:.7;">No active effect systems are enabled.</div>');
  }

  return _menuBox('✨ Active Effects — ' + esc(currentDateLabel()),
    sections.join('') + '<div style="margin-top:7px;">'+button('⬅️ Back','help root')+'</div>'
  );
}

function helpStatusSummaryHtml(){
  var st      = ensureSettings();
  var curDate = esc(currentDateLabel());

  // Build system/variant label.
  var sys     = CALENDAR_SYSTEMS[st.calendarSystem] || {};
  var variant = (sys.variants && sys.variants[st.calendarVariant]) || {};
  var sysLabel = esc(sys.label || titleCase(st.calendarSystem || ''));
  var varLabel = esc(variant.label || titleCase(st.calendarVariant || ''));
  // Show variant only when the system has more than one.
  var varCount = sys.variants ? Object.keys(sys.variants).length : 1;
  var calLine  = varCount > 1 ? sysLabel + ' &mdash; ' + varLabel : sysLabel;

  // Overrides: only show if they deviate from the variant/system defaults.
  var overrides = [];
  var defTheme  = variant.colorTheme || '';
  var curTheme  = st.colorTheme || '';
  if (curTheme && curTheme !== defTheme) overrides.push(esc(titleCase(curTheme)) + ' theme');
  var defSeason = sys.defaultSeason || CONFIG_DEFAULTS.seasonVariant;
  if (st.seasonVariant && st.seasonVariant !== defSeason) overrides.push(esc(titleCase(st.seasonVariant)) + ' seasons');

  var configLine = overrides.length ? overrides.join(' &nbsp;·&nbsp; ') : '';

  return _menuBox('Status',
    '<div style="font-size:1.1em;font-weight:bold;">' + curDate + '</div>' +
    '<div style="font-size:.85em;opacity:.8;margin-top:2px;">' + calLine + '</div>' +
    (configLine ? '<div style="font-size:.75em;opacity:.6;margin-top:2px;">' + configLine + '</div>' : '')
  );
}

function helpRootMenu(m){
  var rows = [];
  rows.push(helpStatusSummaryHtml());

  // ── Display: all show/send buttons inline — no sub-nav ──────────────────
  rows.push(_menuBox('Display',
    '<div style="font-size:.8em;opacity:.7;margin-bottom:2px;">Quick snapshot:</div>'+
    mbP(m,'Now','now')+'<br>'+
    '<div style="font-size:.8em;opacity:.7;margin-bottom:2px;">Month — show self:</div>'+
    mbP(m,'◀ Prev','show previous month')+' '+
    mbP(m,'Current','show month')+' '+
    mbP(m,'Next ▶','show next month')+'<br>'+
    '<div style="font-size:.8em;opacity:.7;margin-top:4px;margin-bottom:2px;">Month — send to chat:</div>'+
    mbP(m,'◀ Prev','send previous month')+' '+
    mbP(m,'Current','send month')+' '+
    mbP(m,'Next ▶','send next month')+'<br>'+
    '<div style="font-size:.8em;opacity:.7;margin-top:4px;margin-bottom:2px;">Year — show self:</div>'+
    mbP(m,'◀ Prev','show previous year')+' '+
    mbP(m,'Current','show year')+' '+
    mbP(m,'Next ▶','show next year')+'<br>'+
    '<div style="font-size:.8em;opacity:.7;margin-top:4px;margin-bottom:2px;">Year — send to chat:</div>'+
    mbP(m,'◀ Prev','send previous year')+' '+
    mbP(m,'Current','send year')+' '+
    mbP(m,'Next ▶','send next year')
  ));

  if (playerIsGM(m.playerid)){
    // ── Events: lists, sources, colors, add syntax ───────────────────────
    rows.push(_menuBox('Events',
      mbP(m,'List All','list')+' '+
      mbP(m,'Remove List','remove list')+' '+
      mbP(m,'Restore List','restore list')+' '+
      mbP(m,'Source List','source list')+' '+
      navP(m,'Colors','eventcolors')+'<br>'+
      '<div style="font-size:.8em;opacity:.7;margin-top:5px;">Add: <code>!cal add [MM DD [YYYY] | MonthName DD | DD] NAME [#COLOR]</code></div>'+
      '<div style="font-size:.8em;opacity:.7;">Enable/disable source: <code>!cal source enable &lt;name&gt;</code></div>'
    ));

    // ── Appearance: nav-to-list pages (content too long to inline) ────────
    rows.push(_menuBox('Appearance',
      navP(m,'Calendar System','calendar')+'<br>'+
      navP(m,'Color Theme','themes')+'<br>'+
      navP(m,'Season Variant','seasons')
    ));

    // ── Settings: toggles + reset note inline — no sub-nav ───────────────
    var st = ensureSettings();
    var grpBtn = mbP(m,
      'Group by Source: '+(st.groupEventsBySource ? 'On ✓' : 'Off'),
      'settings group '+(st.groupEventsBySource ? 'off' : 'on')
    );
    var lblBtn = mbP(m,
      'Source Labels: '+(st.showSourceLabels ? 'On ✓' : 'Off'),
      'settings labels '+(st.showSourceLabels ? 'off' : 'on')
    );
    var evBtn = mbP(m,
      '📅 Events: '+(st.eventsEnabled ? 'On ✓' : 'Off'),
      'settings events '+(st.eventsEnabled ? 'off' : 'on')
    );
    var moonBtn = mbP(m,
      '🌙 Moons: '+(st.moonsEnabled ? 'On ✓' : 'Off'),
      'settings moons '+(st.moonsEnabled ? 'off' : 'on')
    );
    var wxBtn = mbP(m,
      '🌤️ Weather: '+(st.weatherEnabled ? 'On ✓' : 'Off'),
      'settings weather '+(st.weatherEnabled ? 'off' : 'on')
    );
    var wxMechBtn = mbP(m,
      'Weather Mech: '+(st.weatherMechanicsEnabled !== false ? 'On ✓' : 'Off'),
      'settings weathermechanics '+(st.weatherMechanicsEnabled !== false ? 'off' : 'on')
    );
    var plBtn = mbP(m,
      '🌀 Planes: '+(st.planesEnabled ? 'On ✓' : 'Off'),
      'settings planes '+(st.planesEnabled ? 'off' : 'on')
    );
    var offCycBtn = mbP(m,
      '◇ Off-Cycle: '+(st.offCyclePlanes !== false ? 'On ✓' : 'Off'),
      'settings offcycle '+(st.offCyclePlanes !== false ? 'off' : 'on')
    );
    var denBtn = mbP(m,
      'Density: '+(_uiDensityValue(st.uiDensity) === 'compact' ? 'Compact ✓' : 'Normal'),
      'settings density '+(_uiDensityValue(st.uiDensity) === 'compact' ? 'normal' : 'compact')
    );
    var moonMode = _normalizeDisplayMode(st.moonDisplayMode);
    var wxMode = _normalizeDisplayMode(st.weatherDisplayMode);
    var plMode = _normalizeDisplayMode(st.planesDisplayMode);
    var moonViewBtn = mbP(m,
      'Moon View: '+_displayModeLabel(moonMode),
      'settings mode moon '+_nextDisplayMode(moonMode)
    );
    var wxViewBtn = mbP(m,
      'Weather View: '+_displayModeLabel(wxMode),
      'settings mode weather '+_nextDisplayMode(wxMode)
    );
    var plViewBtn = mbP(m,
      'Planes View: '+_displayModeLabel(plMode),
      'settings mode planes '+_nextDisplayMode(plMode)
    );
    var wxDays = _weatherViewDays(st.weatherForecastViewDays);
    var wxSpanBtn = mbP(m,
      'Forecast Span: '+wxDays+'d',
      'settings weatherdays '+(wxDays === 20 ? 10 : 20)
    );
    var verbNow = _subsystemVerbosityValue();
    var verbBtn = mbP(m,
      'Detail: '+(verbNow === 'minimal' ? 'Minimal ✓' : 'Normal'),
      'settings verbosity '+(verbNow === 'minimal' ? 'normal' : 'minimal')
    );
    var autoBtn = mbP(m,
      'Auto Buttons: '+(st.autoButtons ? 'On ✓' : 'Off'),
      'settings buttons '+(st.autoButtons ? 'off' : 'on')
    );
    rows.push(_menuBox('Settings',
      grpBtn+' '+lblBtn+' '+evBtn+' '+moonBtn+' '+wxBtn+' '+wxMechBtn+' '+plBtn+' '+offCycBtn+' '+denBtn+' '+autoBtn+' '+
      moonViewBtn+' '+wxViewBtn+' '+plViewBtn+' '+wxSpanBtn+' '+verbBtn+
      '<div style="font-size:.8em;opacity:.6;margin-top:5px;">Reset everything: <code>!cal resetcalendar</code></div>'
    ));

    // ── Moon & Weather & Planes quick-access ─────────────────────────────
    var featureLinks = [];
    featureLinks.push(mbP(m,'✨ Active Effects','effects'));
    if (st.moonsEnabled   !== false) featureLinks.push(mbP(m,'🌙 Moons','moon'));
    if (st.weatherEnabled !== false) featureLinks.push(mbP(m,'🌤️ Weather','weather'));
    if (st.planesEnabled  !== false) featureLinks.push(mbP(m,'🌀 Planes','planes'));
    if (featureLinks.length){
      rows.push(_menuBox('Systems',
        featureLinks.join(' ')+
        '<div style="font-size:.75em;opacity:.55;margin-top:5px;">Moon query: <code>!cal moon on &lt;dateSpec&gt;</code><br>Plane query: <code>!cal planes on &lt;dateSpec&gt;</code></div>'
      ));
    }
  }

  // ── Player-visible system links (outside GM block) ──────────────────
  if (!playerIsGM(m.playerid)){
    var st2 = ensureSettings();
    var pLinks = [];
    pLinks.push(mbP(m,'📋 Today','today'));
    if (st2.moonsEnabled   !== false) pLinks.push(mbP(m,'🌙 Moons','moon'));
    if (st2.weatherEnabled !== false) pLinks.push(mbP(m,'🌤️ Weather','weather')+' '+mbP(m,'📋 Forecast','forecast'));
    if (st2.planesEnabled  !== false) pLinks.push(mbP(m,'🌀 Planes','planes'));
    if (pLinks.length){
      rows.push(_menuBox('Systems',
        pLinks.join(' ')+
        '<div style="font-size:.75em;opacity:.55;margin-top:5px;">Moon query: <code>!cal moon on &lt;dateSpec&gt;</code><br>Plane query: <code>!cal planes on &lt;dateSpec&gt;</code></div>'
      ));
    }
  }

  whisper(m.who, rows.join(''));
}

function helpThemesMenu(m){
  var ro = !playerIsGM(m.playerid);
  whisper(m.who, _menuBox(ro ? 'Appearance — Themes (view only)' : 'Appearance — Themes', themeListHtml(ro))+'<div style="margin-top:8px;">'+navP(m,'⬅ Back','root')+'</div>');
}

function helpCalendarSystemMenu(m){
  var ro = !playerIsGM(m.playerid);
  whisper(m.who,
    _menuBox(ro ? 'Calendar Systems (view only)' : 'Calendar Systems', calendarSystemListHtml(ro))+
    '<div style="margin-top:8px;">'+navP(m,'⬅ Back','root')+'</div>'
  );
}

function helpEventColorsMenu(m){
  var intro = [
    '<div style="opacity:.85;margin-bottom:6px;">',
    'These are the available <b>named colors for events</b>. ',
    'Any hex (<code>#RRGGBB</code>) is supported, but these names can be used directly. ',
    'Example: <code>!cal add March 14 Feast emerald</code> or ',
    '<code>!cal add 3 14 Feast #50C878</code>.',
    '</div>'
  ].join('');
  whisper(m.who,
    _menuBox('Event Colors', intro + colorsNamedListHtml())+
    '<div style="margin-top:8px;">'+navP(m,'⬅ Back','root')+'</div>'
  );
}

function helpSeasonsMenu(m){
  var ro = !playerIsGM(m.playerid);
  whisper(m.who,
    _menuBox(ro ? 'Season Variants (view only)' : 'Season Variants', seasonSetListHtml(ro))+
    '<div style="margin-top:8px;">'+navP(m,'⬅ Back','root')+'</div>'
  );
}

function seasonSetListHtml(readOnly){
  var st  = ensureSettings();
  var cur = st.seasonVariant || (CALENDAR_SYSTEMS[st.calendarSystem] || {}).defaultSeason || CONFIG_DEFAULTS.seasonVariant;
  var names = _orderedKeys(SEASON_SETS, ['eberron','faerun','gregorian','tropical']);
  if(!names.length) return '<div style="opacity:.7;">No season sets.</div>';

  var rows = names.map(function(n){
    var label = titleCase(n);
    var head = readOnly
      ? '<b>'+esc(label)+':</b>'+(n===cur?' <span style="opacity:.7">(current)</span>':'')
      : button('Set '+label+':', 'seasons '+n)+(n===cur?' <span style="opacity:.7">(current)</span>':'');
    var preview = (_seasonNames(n)||[]).map(esc).join(', ');
    return '<div style="margin:6px 0;">'+ head + '<br><div style="opacity:.85;">'+preview+'</div><br></div>';
  });

  return '<div style="margin:4px 0;"><b>Season Sets</b></div>'+rows.join('');
}

function calendarSystemListHtml(readOnly){
  var st   = ensureSettings();
  var keys = _orderedKeys(CALENDAR_SYSTEMS, CALENDAR_SYSTEM_ORDER);
  if (!keys.length) return '<div style="opacity:.7;">No calendar systems defined.</div>';

  var rows = keys.map(function(sysKey){
    var sys   = CALENDAR_SYSTEMS[sysKey];
    var sLabel = esc(sys.label || titleCase(sysKey));
    var desc   = sys.description ? '<div style="font-size:.82em;opacity:.65;margin-bottom:4px;">'+esc(sys.description)+'</div>' : '';
    var varKeys = sys.variants ? Object.keys(sys.variants) : [];
    var varRows = varKeys.map(function(vk){
      var v     = sys.variants[vk];
      var vLabel = esc(v.label || titleCase(vk));
      var isCur  = st.calendarSystem === sysKey && st.calendarVariant === vk;
      var head   = readOnly
        ? '<b>'+vLabel+'</b>'+(isCur?' <span style="opacity:.7">(current)</span>':'')
        : button(vLabel, 'calendar '+sysKey+' '+vk)+(isCur?' <span style="opacity:.7">(current)</span>':'');
      var preview = (v.monthNames||[]).slice(0,4).map(esc).join(', ')+(v.monthNames&&v.monthNames.length>4?' …':'');
      return '<div style="margin:3px 0 3px 8px;">'+head+'<br><div style="font-size:.82em;opacity:.7;">'+preview+'</div></div>';
    });
    return '<div style="margin:8px 0;">'+
      '<div style="font-weight:bold;margin-bottom:2px;">'+sLabel+'</div>'+
      desc + varRows.join('') +
      '</div>';
  });

  return '<div style="margin:4px 0;"><b>Calendar Systems</b></div>'+rows.join('<hr style="border:none;border-top:1px solid #444;margin:4px 0;">');
}

