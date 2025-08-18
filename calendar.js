// Version: 1.0 
var Calendar = (function(){
    'use strict';
    var script_name = 'Calendar';
    var state_name  = 'CALENDAR';

    // Default data
    var defaults = {
        current: { month: 0, day_of_the_month: 1, day_of_the_week: 0, year: 998 },
        weekdays: ["Sul","Mol","Zol","Wir","Zor","Far","Sar"],
        months: [
            { name: "Zarantyr",  days: 28, season: "Mid-winter",    color: "#F5F5FA" },
            { name: "Olarune",   days: 28, season: "Late winter",   color: "#FFC68A" },
            { name: "Therendor", days: 28, season: "Early spring",  color: "#D3D3D3" },
            { name: "Eyre",      days: 28, season: "Mid-spring",    color: "#C0C0C0" },
            { name: "Dravago",   days: 28, season: "Late spring",   color: "#E6E6FA" },
            { name: "Nymm",      days: 28, season: "Early summer",  color: "#FFD96B" },
            { name: "Lharvion",  days: 28, season: "Mid-summer",    color: "#F5F5F5" },
            { name: "Barrakas",  days: 28, season: "Late summer",   color: "#DCDCDC" },
            { name: "Rhaan",     days: 28, season: "Early autumn",  color: "#9AC0FF" },
            { name: "Sypheros",  days: 28, season: "Mid-autumn",    color: "#696969" },
            { name: "Aryth",     days: 28, season: "Late autumn",   color: "#FF4500" },
            { name: "Vult",      days: 28, season: "Early winter",  color: "#A9A9A9" }
        ],
        events: [
            { name: "Crystalfall",             month: 1,  day: 9 },
            { name: "The Day of Mourning",     month: 1,  day: 20 },
            { name: "Sun's Blessing",          month: 2,  day: 15 },
            { name: "Aureon's Crown",          month: 4,  day: 26 },
            { name: "Brightblade",             month: 5,  day: 12 },
            { name: "The Race of Eight Winds", month: 6,  day: 23 },
            { name: "The Hunt",                month: 7,  day: 4 },
            { name: "Fathen's Fall",           month: 7,  day: 25 },
            { name: "Boldrei's Feast",         month: 8,  day: 9 },
            { name: "The Ascension",           month: 9,  day: 1 },
            { name: "Wildnight",               month: 9,  day: "18-19" },
            { name: "Thronehold",              month: 10, day: 11 },
            { name: "Long Shadows",            month: 11, day: "26-28" }
        ]
    };

    function gmod(a,b){ return ((a%b)+b)%b; }
    function getCal(){ return state[state_name].calendar; }

    function checkInstall(){
        if(!state[state_name]) state[state_name]={};
        var cal = state[state_name].calendar;

        // Initialize or repair the calendar object
        if(!cal || !Array.isArray(cal.weekdays) || !Array.isArray(cal.months)){
            state[state_name].calendar = JSON.parse(JSON.stringify(defaults));
        } else {
            cal.current  = cal.current  || JSON.parse(JSON.stringify(defaults.current));
            cal.weekdays = cal.weekdays || JSON.parse(JSON.stringify(defaults.weekdays));
            cal.months   = cal.months   || JSON.parse(JSON.stringify(defaults.months));
            cal.events   = cal.events   || JSON.parse(JSON.stringify(defaults.events));
        }
    }

    function isEvent(m,d){
        return getCal().events.some(function(e){
            var em = e.month - 1;
            if(em !== m) return false;
            if(typeof e.day === 'number') return d === e.day;
            if(typeof e.day === 'string' && e.day.includes('-')){
                var parts = e.day.split('-').map(Number);
                return d >= parts[0] && d <= parts[1];
            }
            return false;
        });
    }

    // Choose white or black text based on background color brightness
function headerTextColor(bg){
    var hex = String(bg||'').trim();
    var m = /^#?([0-9a-f]{6})$/i.exec(hex);
    if(!m) return '#000';
    var n = parseInt(m[1],16);
    var r = (n>>16)&255, g = (n>>8)&255, b = n&255;
    // YIQ luma; tweak threshold to taste (128–160 is common)
    var yiq = (r*299 + g*587 + b*114)/1000;
    return yiq >= 145 ? '#000' : '#fff';
}

    function buildMiniCal(){
        var cal = getCal(), cur = cal.current;
        var wd = cal.weekdays, md = cal.months[cur.month].days;
        var first = gmod(cur.day_of_the_week - (cur.day_of_the_month - 1), wd.length);
        var monthColor = cal.months[cur.month].color;
        var html = ['<table style="border-collapse:collapse;margin-bottom:0px;">'];

        var textColor = headerTextColor(monthColor);

        // Header: month left, year right; full-width colored bar with auto-contrast text
        html.push(
            '<tr><th colspan="7" style="border:1px solid #444;padding:6px;'+
            'background-color:'+monthColor+';color:'+textColor+';">'+
            cal.months[cur.month].name+
            '<span style="float:right;">'+cur.year+' YK</span>'+
            '</th></tr>'
        );

        // Weekday header
        html.push(
            '<tr>' + wd.map(function(d){
                return '<th style="border:1px solid #444;padding:2px;width:2em;">'+d+'</th>';
            }).join('') + '</tr>'
        );

        var day=1;
        for(var r=0;r<6;r++){
            html.push('<tr>');
            for(var c=0;c<7;c++){
                if((r===0 && c<first) || day>md){
                    html.push('<td style="border:1px solid #444;width:2em;height:2em;"></td>');
                } else {
                    var today = day === cur.day_of_the_month;
                    var ev    = isEvent(cur.month, day);
                    var style = 'border:1px solid #444;width:2em;height:2em;text-align:center;';
                    if(ev && today)        style += 'background:#DAA520;color:#fff;';
                    else if(today)         style += 'background:#2ECD71;color:#fff;';
                    else if(ev)            style += 'background:#FFD700;';

                    html.push('<td style="'+style+'">'+day+'</td>');
                    day++;
                }
            }
            html.push('</tr>');
            if(day>md) break;
        }
        html.push('</table>');
        return html.join('');
    }

    function announceDay(to, gmOnly){
        var cal=getCal(), c=cal.current;
        var m=cal.months[c.month], wd=cal.weekdays[c.day_of_the_week];

        var publicMsg = [
            buildMiniCal(),
            '<div style="font-weight:bold;margin:2px 0;">'+wd+', '+m.name+' '+c.day_of_the_month+', '+c.year+'</div>'
        ];

        cal.events
          .filter(function(e){ return e.month-1===c.month; })
          .forEach(function(e){ publicMsg.push('<div>'+m.name+' '+e.day+': '+e.name+'</div>'); });

        publicMsg.push('<div style="margin-top:8px;"></div>');
        publicMsg.push('<div>Season: '+m.season+'</div>');

        if(gmOnly){
            sendChat(script_name, '/w gm ' + publicMsg.join(''));
        } else if(to){
            var target = String(to).replace(/\s+\(GM\)$/,'');
            sendChat(script_name, '/w "'+target+'" ' + publicMsg.join(''));
        } else {
            sendChat(script_name, '/direct ' + publicMsg.join(''));
        }

        var gmButtons =
            '[⏭ Advance Day](!cal advanceDay) '+
            '[⏮ Retreat Day](!cal retreatDay) '+
            '[📅 Set 01 01 998](!cal setDate 01 01 998) '+
            '[❓ Help](!cal help) '+
            '[📤 Send Date](!cal sendDate)';
        sendChat(script_name, '/w gm ' + gmButtons);
}

    function recomputeWeekday(){
        var cal=getCal(), cur=cal.current;
        cur.day_of_the_week = (cur.day_of_the_month - 1) % cal.weekdays.length; // 1→Sul(0)
    }

function advanceDay(){
    var cal=getCal(), cur=cal.current;
    cur.day_of_the_month++;
    if(cur.day_of_the_month > cal.months[cur.month].days){
        cur.day_of_the_month = 1;
        cur.month = (cur.month + 1) % cal.months.length;
        if(cur.month===0) cur.year++;
    }
    recomputeWeekday();
    announceDay(null,true); // GM only
}

function retreatDay(){
    var cal=getCal(), cur=cal.current;
    cur.day_of_the_month--;
    if(cur.day_of_the_month < 1){
        cur.month = (cur.month + cal.months.length - 1) % cal.months.length;
        if(cur.month === cal.months.length - 1){
            cur.year = Math.max(0, cur.year - 1);
        }
        cur.day_of_the_month = cal.months[cur.month].days;
    }
    recomputeWeekday();
    announceDay(null,true); // GM only
}

function setDate(d,m,y){
    var cal=getCal(), cur=cal.current;
    var mi = Math.max(0, Math.min((parseInt(m,10) || 1) - 1, cal.months.length-1));
    var di = Math.max(1, Math.min(parseInt(d,10) || 1, cal.months[mi].days));
    var yi = parseInt(y,10);

    cur.month            = mi;
    cur.day_of_the_month = di;
    if(Number.isFinite(yi)) cur.year = yi;

    recomputeWeekday();
    announceDay(null,true); // GM only
}

    function showHelp(to){
    var help = [
        '<div style="margin:4px 0;"><b>Calendar Commands</b></div>',
        '<div>• <code>!cal</code> — show the calendar (whispered to you)</div>',
        '<div>• <code>!cal advanceDay</code> — advance one day <i>(GM‑only)</i></div>',
        '<div>• <code>!cal retreatDay</code> — go back one day <i>(GM‑only)</i></div>',
        '<div>• <code>!cal setDate &lt;dd&gt; &lt;mm&gt; [yyyy]</code> — set date, day‑first; leading zeros optional <i>(GM‑only)</i></div>',
        '<div>• <code>!cal sendDate</code> — broadcast the calendar to everyone <i>(GM‑only)</i></div>',
        '<div>• <code>!cal help</code> — show this help</div>'
    ].join('');
    sendChat(script_name, (to ? '/w '+to+' ' : '') + help);
}

function handleInput(msg){
    if(msg.type!=='api' || !/^!cal\b/i.test(msg.content)) return;
    var args = msg.content.trim().split(/\s+/);
    var sub = (args[1]||'').toLowerCase();

    // Commands open to everyone
    if(sub === '' || sub === 'show'){
        announceDay(msg.who); // whisper to whoever called !cal
        return;
    }

    // GM-only from here
    if(!playerIsGM(msg.playerid)){
        var who = (msg.who || '').replace(/\s+\(GM\)$/,'');
        sendChat(script_name, '/w "'+who+'" Only the GM can use that calendar command.');
        return;
    }

    if(sub === 'advanceday'){
        advanceDay();                    // whispers to GM (via announceDay(null,true))
    } else if(sub === 'retreatday'){
        retreatDay();                    // whispers to GM
    } else if(sub === 'setdate'){
        setDate(args[2], args[3], args[4]); // whispers to GM
    } else if(sub === 'senddate'){
        announceDay();                   // broadcast to all
    } else if(sub === 'help'){
        showHelp(msg.who);               // whisper help to the GM who asked
    } else {
        announceDay(msg.who);            // fallback: whisper to caller
    }
}

function register(){ on('chat:message', handleInput); }
    return { checkInstall: checkInstall, register: register };
})();

on("ready", () => {
    Calendar.checkInstall();
    Calendar.register();

    // Build readable date string
    const cal = state.CALENDAR.calendar;
    const cur = cal.current;
    const months = cal.months.map(m => m.name);
    const weekdays = cal.weekdays;
    const currentDate = `${weekdays[cur.day_of_the_week]}, ${cur.day_of_the_month} ${months[cur.month]}, ${cur.year} YK`;

    // API console
    log(`Eberron Calendar Running, current date: ${currentDate}`);

    // Whisper to GM
    sendChat("Calendar", `/w gm <div style="font-weight:bold;">Eberron Calendar Initialized</div><div>Current date: ${currentDate}</div>`);
});
