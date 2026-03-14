/* ============================================================================
 * 11) SHOW/SEND
 * ==========================================================================*/

function deliverRange(opts){
  opts = opts || {};
  var args = opts.args || [];

  var spec = parseUnifiedRange(_tokenizeRangeArgs(args));
  var calHtml = buildCalendarsHtmlForSpec(spec);
  var html = calHtml;

  if (opts.mode !== 'cal'){
    var ext = stripRangeExtensionDynamic(spec) || spec;
    var forceYear = (Math.floor(ext.start/daysPerYear()) !== Math.floor(ext.end/daysPerYear()));
    var listHtml = eventsListHTMLForRange(spec.title, ext.start, ext.end, forceYear);
    html = calHtml + '<div style="height:8px"></div>' + listHtml;
  }

  return (opts.dest === 'broadcast') ? sendToAll(html) : whisper(opts.who, html);
}

// ---------------------------------------------------------------------------
// Synthetic minical helpers (for subsystem overlays)
// ---------------------------------------------------------------------------

function _buildSyntheticEventsLookup(syntheticEvents, fallbackTitle){
  var bySerial = {};
  if (!Array.isArray(syntheticEvents)) return bySerial;
  for (var i = 0; i < syntheticEvents.length; i++){
    var se = syntheticEvents[i];
    if (!se || !isFinite(se.serial)) continue;
    var key = String(se.serial|0);
    if (!bySerial[key]) bySerial[key] = [];
    bySerial[key].push({
      name: String(se.name || fallbackTitle || 'Highlight'),
      color: resolveColor(se.color) || '#607D8B',
      source: null
    });
  }
  return bySerial;
}

function _renderSyntheticMiniCal(title, startSerial, endSerial, syntheticEvents){
  var bySerial = _buildSyntheticEventsLookup(syntheticEvents, title);
  return buildCalendarsHtmlForSpec({
    title: title,
    start: startSerial,
    end: endSerial,
    includeCalendarEvents: false,
    extraEventsFn: function(serial){
      return bySerial[String(serial)] || [];
    }
  });
}

function _monthRangeFromSerial(serial){
  var d = fromSerial(serial|0);
  var m = getCal().months[d.mi] || {};
  var days = Math.max(1, m.days|0);
  return {
    start: toSerial(d.year, d.mi, 1),
    end: toSerial(d.year, d.mi, days),
    year: d.year,
    mi: d.mi
  };
}

function _stripHtmlTags(s){
  return String(s || '').replace(/<[^>]*>/g, '').trim();
}

