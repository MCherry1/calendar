/* ============================================================================
 * 14) BUTTONED TABLES / LISTS
 * ==========================================================================*/

function _encKey(k){ return encodeURIComponent(String(k)); }
function _decKey(k){ try { return decodeURIComponent(String(k)); } catch(e){ return String(k||''); } }

function _eventSeriesKey(e){
  var y   = (e.year==null) ? 'ALL' : String(e.year|0);
  var day = String(e.day||'').trim().toLowerCase();
  var nm  = String(e.name||'').trim().toLowerCase();
  var src = (e.source!=null) ? String(e.source).trim().toLowerCase() : '';
  return y + '|' + day + '|' + nm + '|' + src;
}

function _eventRowsForTables(evs){
  var cal = getCal();
  var monthCount = Math.max(1, cal.months.length);
  var groups = {};
  var order = [];

  (evs || []).forEach(function(e){
    var sk = _eventSeriesKey(e);
    if (!groups[sk]){
      groups[sk] = { key: sk, months: {}, entries: [] };
      order.push(sk);
    }
    groups[sk].entries.push(e);
    groups[sk].months[e.month|0] = 1;
  });

  var rows = [];
  order.forEach(function(sk){
    var g = groups[sk];
    var months = Object.keys(g.months);
    var collapseAllMonths = (g.entries.length > 1 && months.length === monthCount);

    if (collapseAllMonths){
      var lead = g.entries[0];
      rows.push({
        event: lead,
        mmLabel: 'ALL',
        removeCmd: 'remove series ' + _encKey(sk),
        groupedCount: g.entries.length
      });
      return;
    }

    g.entries.forEach(function(e){
      rows.push({
        event: e,
        mmLabel: String(e.month|0),
        removeCmd: 'remove key ' + _encKey(eventKey(e)),
        groupedCount: 1
      });
    });
  });

  return rows;
}

function listAllEventsTableHtml(){
  var cal = getCal(), evs = cal.events || [];
  if(!evs.length) return '<div style="opacity:.7;">No events.</div>';

  var listRows = _eventRowsForTables(evs);
  var rows = listRows.map(function(row, i){
    var e = row.event;
    var dd = esc(String(e.day));
    var yyyy = (e.year==null) ? 'ALL' : esc(String(e.year));
    var name = esc(eventDisplayName(e)) + (row.groupedCount > 1 ? ' <span style="opacity:.65;">(' + row.groupedCount + 'x)</span>' : '');
    var sw = swatchHtml(getEventColor(e));
    return '<tr>'+
      '<td style="'+STYLES.td+';text-align:right;">#'+(i+1)+'</td>'+
      '<td style="'+STYLES.td+'">'+ sw + name +'</td>'+
      '<td style="'+STYLES.td+';text-align:center;">'+ esc(row.mmLabel) +'</td>'+
      '<td style="'+STYLES.td+';text-align:center;">'+ dd +'</td>'+
      '<td style="'+STYLES.td+';text-align:center;">'+ yyyy +'</td>'+
    '</tr>';
  });

  var head = '<tr>'+
    '<th style="'+STYLES.th+'">Index</th>'+
    '<th style="'+STYLES.th+'">Event</th>'+
    '<th style="'+STYLES.th+'">MM</th>'+
    '<th style="'+STYLES.th+'">DD</th>'+
    '<th style="'+STYLES.th+'">YYYY</th>'+
  '</tr>';

  return '<div style="margin:4px 0;"><b>All Events (meta view)</b></div>'+
         '<table style="'+STYLES.table+'">'+ head + rows.join('') +'</table>'+
         '<div style="opacity:.7;margin-top:4px;">Recurring events that span every month are grouped as one row.</div>';
}

function removeListHtml(){
  var cal = getCal(), evs = cal.events || [];
  if(!evs.length) return '<div style="opacity:.7;">No events to remove.</div>';

  var listRows = _eventRowsForTables(evs);
  var rows = listRows.map(function(row, i){
    var e = row.event;
    var dd = esc(String(e.day));
    var yyyy = (e.year==null) ? 'ALL' : esc(String(e.year));
    var name = esc(eventDisplayName(e)) + (row.groupedCount > 1 ? ' <span style="opacity:.65;">(' + row.groupedCount + 'x)</span>' : '');
    var sw = swatchHtml(getEventColor(e));
    var rm = button('Remove', row.removeCmd);
    return '<tr>'+
      '<td style="'+STYLES.td+';text-align:right;">#'+(i+1)+'</td>'+
      '<td style="'+STYLES.td+'">'+ sw + name +'</td>'+
      '<td style="'+STYLES.td+';text-align:center;">'+ esc(row.mmLabel) +'</td>'+
      '<td style="'+STYLES.td+';text-align:center;">'+ dd +'</td>'+
      '<td style="'+STYLES.td+';text-align:center;">'+ yyyy +'</td>'+
      '<td style="'+STYLES.td+';text-align:center;">'+ rm +'</td>'+
    '</tr>';
  });

  var head = '<tr>'+
    '<th style="'+STYLES.th+'">Index</th>'+
    '<th style="'+STYLES.th+'">Event</th>'+
    '<th style="'+STYLES.th+'">MM</th>'+
    '<th style="'+STYLES.th+'">DD</th>'+
    '<th style="'+STYLES.th+'">YYYY</th>'+
    '<th style="'+STYLES.th+'">Action</th>'+
  '</tr>';

  return '<div style="margin:4px 0;"><b>Remove Events</b></div>'+
         '<table style="'+STYLES.table+'">'+ head + rows.join('') +'</table>'+
         '<div style="opacity:.7;margin-top:4px;">Recurring events that span every month are grouped into one remove button.</div>';
}

function removeMatchesListHtml(needle){
  var cal = getCal(), evs = cal.events || [];
  var q = String(needle||'').trim().toLowerCase();
  if (!q) return '<div style="opacity:.7;">Provide a name fragment to search.</div>';

  var listRows = _eventRowsForTables(evs).filter(function(row){
    return String((row.event && row.event.name) || '').toLowerCase().indexOf(q) !== -1;
  });
  if (!listRows.length){ return '<div style="opacity:.7;">No events matched "' + esc(needle) + '".</div>'; }

  var head = '<tr>'+
    '<th style="'+STYLES.th+'">Index</th>'+
    '<th style="'+STYLES.th+'">Event</th>'+
    '<th style="'+STYLES.th+'">MM</th>'+
    '<th style="'+STYLES.th+'">DD</th>'+
    '<th style="'+STYLES.th+'">YYYY</th>'+
    '<th style="'+STYLES.th+'">Action</th>'+
  '</tr>';

  var rows = listRows.map(function(row, i){
    var e = row.event;
    var dd = esc(String(e.day));
    var yyyy = (e.year==null) ? 'ALL' : esc(String(e.year));
    var name = esc(eventDisplayName(e)) + (row.groupedCount > 1 ? ' <span style="opacity:.65;">(' + row.groupedCount + 'x)</span>' : '');
    var sw = swatchHtml(getEventColor(e));
    var rm = button('Remove', row.removeCmd);
    return '<tr>'+
      '<td style="'+STYLES.td+';text-align:right;">#'+(i+1)+'</td>'+
      '<td style="'+STYLES.td+'">'+ sw + name +'</td>'+
      '<td style="'+STYLES.td+';text-align:center;">'+ esc(row.mmLabel) +'</td>'+
      '<td style="'+STYLES.td+';text-align:center;">'+ dd +'</td>'+
      '<td style="'+STYLES.td+';text-align:center;">'+ yyyy +'</td>'+
      '<td style="'+STYLES.td+';text-align:center;">'+ rm +'</td>'+
    '</tr>';
  }).join('');

  return '<div style="margin:4px 0;"><b>Remove Matches for "' + esc(needle) + '"</b></div>'+
         '<table style="'+STYLES.table+'">'+ head + rows +'</table>'+
         '<div style="opacity:.7;margin-top:4px;">Recurring all-month events are grouped into one remove button.</div>';
}

function suppressedDefaultsListHtml(){
  var sup = state[state_name].suppressedDefaults || {};
  var keys = Object.keys(sup);
  if (!keys.length){ return '<div style="opacity:.7;">No suppressed default events.</div>'; }

  keys.sort(function(a,b){
    var pa=a.split('|'), pb=b.split('|');
    var ma=(+pa[0]||0), mb=(+pb[0]||0);
    if (ma!==mb) return ma-mb;
    var da=DaySpec.first(pa[1]||'1'), db=DaySpec.first(pb[1]||'1');
    if (da!==db) return da-db;
    return String(pa[3]||'').localeCompare(String(pb[3]||''));
  });

  var rows = keys.map(function(k){
    var info = _defaultDetailsForKey(k);
    var mi = (info.month|0)-1, mm = (mi+1);
    var dd = esc(String(info.day));
    var sw = swatchHtml(info.color || autoColorForEvent({name:info.name}));
    var src = info.source ? ' <span style="opacity:.7">('+esc(titleCase(info.source))+')</span>' : '';
    var restorebutton = button('Restore', 'restore key '+_encKey(k));
    return '<tr>'+
      '<td style="'+STYLES.td+'">'+sw+esc(info.name)+src+'</td>'+
      '<td style="'+STYLES.td+';text-align:center;">'+ mm +'</td>'+
      '<td style="'+STYLES.td+';text-align:center;">'+ dd +'</td>'+
      '<td style="'+STYLES.td+';text-align:center;">ALL</td>'+
      '<td style="'+STYLES.td+';text-align:center;">'+ restorebutton +'</td>'+
    '</tr>';
  });

  var head = '<tr>'+
    '<th style="'+STYLES.th+'">Event</th>'+
    '<th style="'+STYLES.th+'">MM</th>'+
    '<th style="'+STYLES.th+'">DD</th>'+
    '<th style="'+STYLES.th+'">YYYY</th>'+
    '<th style="'+STYLES.th+'">Action</th>'+
  '</tr>';

  return '<div style="margin:4px 0;"><b>Suppressed Default Events</b></div>'+
         '<div style="margin:2px 0;">'+button('Restore All', 'restore all')+'</div>'+
         '<table style="'+STYLES.table+'">'+ head + rows.join('') +'</table>';
}

function restoreDefaultEvents(query){
  var cal = getCal();
  var sup = state[state_name].suppressedDefaults || (state[state_name].suppressedDefaults = {});
  var q = String(query||'').trim();
  if (!q){
    sendChat(script_name, '/w gm Usage: <code>!cal restore [all] [exact] &lt;name...&gt; | restore key &lt;KEY&gt; | restore list</code>');
    return;
  }

  var parts = q.split(/\s+/);
  var sub = (parts[0]||'').toLowerCase();

  if (sub === 'all'){
    state[state_name].suppressedDefaults = {};
    mergeInNewDefaultEvents(cal);
    refreshAndSend();
    sendChat(script_name, '/w gm Restored all default events (sources left as-is).');
    return;
  }

  if (sub === 'key'){
    var key = _decKey(parts.slice(1).join(' ').trim());
    if (!key){ sendChat(script_name, '/w gm Usage: <code>!cal restore key &lt;KEY&gt;</code>'); return; }
    delete sup[key];
    mergeInNewDefaultEvents(cal);
    refreshAndSend();
    sendChat(script_name, '/w gm Restored default for key: <code>'+esc(key)+'</code>.');
    return;
  }

  var exact = false;
  if (sub === 'exact'){ exact = true; parts.shift(); }
  var needle = parts.join(' ').trim().toLowerCase();
  if (!needle){ sendChat(script_name, '/w gm Usage: <code>!cal restore [exact] &lt;name...&gt;</code>'); return; }

  var keys = Object.keys(sup);
  var restored = 0;
  keys.forEach(function(k){
    var info = _defaultDetailsForKey(k);
    var nm = String(info.name||'').toLowerCase();
    if ((exact && nm === needle) || (!exact && nm.indexOf(needle) !== -1)){
      delete sup[k];
      restored++;
    }
  });

  mergeInNewDefaultEvents(cal);
  refreshAndSend();
  sendChat(script_name, '/w gm Restored '+restored+' default event'+(restored===1?'':'s')+' matching "'+esc(needle)+'".');
}

