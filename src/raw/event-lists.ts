/* ============================================================================
 * 12) EVENTS LISTS
 * ==========================================================================*/

function eventsListHTMLForRange(title, startSerial, endSerial, forceYearLabel){
  var st = ensureSettings();
  var today = todaySerial();
  var occ = occurrencesInRange(startSerial, endSerial);
  var includeYear = forceYearLabel || (Math.floor(startSerial/daysPerYear()) !== Math.floor(endSerial/daysPerYear()));
  var out = ['<div style="margin:4px 0;"><b>'+esc(title)+'</b></div>'];

  if (!occ.length){
    out.push('<div style="opacity:.7;">No events in this range.</div>');
    return out.join('');
  }

  if (!st.groupEventsBySource){
    for (var i=0;i<occ.length;i++){
      var o = occ[i];
      var name2 = eventDisplayName(o.e);
      out.push(eventLineHtml(o.y, o.m, o.d, name2, includeYear, (o.serial===today), getEventColor(o.e)));
    }
    return out.join('');
  }

  var groups = {}, order = [];
  for (var k=0;k<occ.length;k++){
    var o2 = occ[k];
    var src = (o2.e && typeof o2.e.source === 'string') ? o2.e.source.trim() : '';
    var key = src ? titleCase(src) : 'Other';
    if (!groups[key]){ groups[key] = []; order.push(key); }
    groups[key].push(o2);
  }
  order.sort(function(a,b){ if (a==='Other') return 1; if (b==='Other') return -1; return a.localeCompare(b); });
  for (var g=0; g<order.length; g++){
    var label = order[g];
    out.push('<div style="margin-top:6px;font-weight:bold;">'+esc(label)+'</div>');
    var arr = groups[label];
    for (var j=0;j<arr.length;j++){
      var o3 = arr[j];
      var name3 = st.showSourceLabels ? (o3.e && o3.e.name ? String(o3.e.name) : '(unnamed event)')
                                      : eventDisplayName(o3.e);
      out.push(eventLineHtml(o3.y, o3.m, o3.d, name3, includeYear, (o3.serial===today), getEventColor(o3.e)));
    }
  }
  return out.join('');
}

