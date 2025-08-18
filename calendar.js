// Enhanced Calendar Script for Roll20
// Full calendar with header, month-specific colors, event highlights, and details
// Month color comments use the classic Eberron moon palette:
// Zarantyr: pearly white (#F8F8FF)
// Olarune: pale orange (#FFDAB9)
// Therendor: pale green (#90EE90)
// Eyre: pale gold (#F0E68C)
// Dravago: pale plum (#DDA0DD)
// Nymm: pale turquoise (#AFEEEE)
// Lharvion: pale thistle (#D8BFD8)
// Barrakas: pale salmon (#FFA07A)
// Rhaan: pale gold-yellow (#FAFAD2)
// Sypheros: medium purple (#9370DB)
// Aryth: indigo (#4B0082)
// Vult: light slate gray (#778899)
var Calendar = (function(){
    'use strict';
    var script_name = 'Calendar';
    var state_name  = 'CALENDAR';

    // Default data
    var defaults = {
        current: { month: 0, day_of_the_month: 1, day_of_the_week: 0, year: 998 },
        weekdays: ["Sul","Mol","Zol","Wir","Zor","Far","Sar"],
        months: [
            { name: "Zarantyr",  days: 28, season: "Mid-winter",    color: "#F8F8FF" },
            { name: "Olarune",   days: 28, season: "Late winter",   color: "#FFDAB9" },
            { name: "Therendor", days: 28, season: "Early spring",  color: "#90EE90" },
            { name: "Eyre",      days: 28, season: "Mid-spring",    color: "#F0E68C" },
            { name: "Dravago",   days: 28, season: "Late spring",   color: "#DDA0DD" },
            { name: "Nymm",      days: 28, season: "Early summer",  color: "#AFEEEE" },
            { name: "Lharvion",  days: 28, season: "Mid-summer",    color: "#D8BFD8" },
            { name: "Barrakas",  days: 28, season: "Late summer",   color: "#FFA07A" },
            { name: "Rhaan",     days: 28, season: "Early autumn",  color: "#FAFAD2" },
            { name: "Sypheros",  days: 28, season: "Mid-autumn",    color: "#9370DB" },
            { name: "Aryth",     days: 28, season: "Late autumn",   color: "#4B0082" },
            { name: "Vult",      days: 28, season: "Early winter",  color: "#778899" }
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
        ],
        environment: {
            location:       "Unknown",
            climate:        "continental",
            baseWeather:    "clear",
            currentWeather: "clear",
            timeOfDay:      "Morning"
        },
        climates: {
            tropical:    ["stuffy","rainy","muggy"],
            continental: ["clear","cool","breezy"]
        }
    };

    function gmod(a,b){ return ((a%b)+b)%b; }
    function getCal(){ return state[state_name].calendar; }

    function checkInstall(){
        if(!state[state_name]) state[state_name]={};
        var cal = state[state_name].calendar;
        if(!cal || !Array.isArray(cal.weekdays) || !cal.environment){
            state[state_name].calendar = JSON.parse(JSON.stringify(defaults));
        } else {
            cal.events       = cal.events       || defaults.events;
            cal.weekdays     = cal.weekdays     || defaults.weekdays;
            cal.months       = cal.months       || defaults.months;
            cal.environment  = Object.assign({}, defaults.environment, cal.environment);
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

    function buildMiniCal(){
        var cal = getCal(), cur = cal.current;
        var wd = cal.weekdays, md = cal.months[cur.month].days;
        var first = gmod(cur.day_of_the_week - (cur.day_of_the_month - 1), wd.length);
        var monthColor = cal.months[cur.month].color;
        var html = ['<table style="border-collapse:collapse;margin-bottom:0px;">'];

        // Header: month left, year right
        html.push(
            '<tr><th colspan="7" '+
            'style="border:1px solid #444;padding:6px;background-color:'+monthColor+';">'+
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

    function announceDay(){
        var cal=getCal(), c=cal.current;
        var m=cal.months[c.month], wd=cal.weekdays[c.day_of_the_week];
        var publicMsg = [ buildMiniCal(),
            '<div style="font-weight:bold;margin:2px 0;">'+wd+', '+m.name+' '+c.day_of_the_month+', '+c.year+'</div>'
        ];
        cal.events.filter(function(e){ return e.month-1===c.month; })
            .forEach(function(e){ publicMsg.push('<div>'+m.name+' '+e.day+': '+e.name+'</div>'); });
        publicMsg.push('<div style="margin-top:8px;"></div>');
        publicMsg.push('<div>Season: '+m.season+'</div>');
        publicMsg.push('<div>Location: '+cal.environment.location+'</div>');
        publicMsg.push('<div>Climate: '+cal.environment.climate+'</div>');
        publicMsg.push('<div>Daily Weather: '+cal.environment.baseWeather+'</div>');
        publicMsg.push('<div>Time of Day: '+cal.environment.timeOfDay+'</div>');
        publicMsg.push('<div>Current Weather: '+cal.environment.currentWeather+'</div>');
        sendChat(script_name, '/direct ' + publicMsg.join(''));

        // GM-only buttons
        var gmButtons =
            '<div style="margin-top:6px;">'+
            '<a href="!cal advance day">⏭ Advance Day</a> '+
            '<a href="!cal set 1 1 998">📅 Set Date</a>'+  // example usage
            '</div>';
        sendChat(script_name, '/w gm ' + gmButtons);
    }

    function advanceDay(){
        var cal=getCal(), cur=cal.current;
        cur.day_of_the_week = gmod(cur.day_of_the_week+1, cal.weekdays.length);
        cur.day_of_the_month++;
        if(cur.day_of_the_month > cal.months[cur.month].days){
            cur.day_of_the_month = 1;
            cur.month = gmod(cur.month+1, cal.months.length);
            if(cur.month===0) cur.year++;
        }
        var pool = cal.climates[cal.environment.climate] || [];
        cal.environment.baseWeather    = pool.length ? pool[randomInteger(pool.length)-1] : cal.environment.baseWeather;
        cal.environment.currentWeather = cal.environment.baseWeather;
        cal.environment.timeOfDay      = 'Morning';
        announceDay();
    }

    function setDate(m,d,y){
        var cal=getCal(), cur=cal.current;
        cur.month            = parseInt(m,10)-1;
        cur.day_of_the_month = parseInt(d,10);
        cur.year             = parseInt(y,10) || cur.year;
        announceDay();
    }

    function handleInput(msg){
        if(msg.type!=='api' || !msg.content.startsWith('!cal')) return;
        var args = msg.content.split(' ');
        if(args[1]==='advance' && args[2]==='day') advanceDay();
        else if(args[1]==='set') setDate(args[2],args[3],args[4]);
        else announceDay();
    }

    function register(){ on('chat:message', handleInput); }
    return { checkInstall: checkInstall, register: register };
})();

on('ready', function(){
    Calendar.checkInstall();
    Calendar.register();
});
