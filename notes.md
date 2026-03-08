Big message here. Feel free to tackle this all at once, or pin parts of it for later. I’ll let you decide how to use your processing most efficiently.

I updated some of the weather system terms and details. None of the “code”. You’ll see them.

I made a mistake. Daanvi is at 1% chance when it should be at 5%. Change that d100 (100) to d20 (10), then d10 (1-5 rem, 6-10 cot). That should hit our correct 16.8 events annually, 10d lengths. And we’ll still use the balancing act to bias towards a flipped state.

On the subject of planes, I’d like a toggle to enable or disable “generated” planar events. I think we just have a toggle for the entire system, right now.

Additionally, I see in your thought processing that you are keeping legacy names and aliases. You can ask me for specific clarification, but this script hasn’t been used in any “real” game yet, so the state won’t get confused by removing those references in the code.

I noticed that you are clamping the eccentricity of Lharvion compared to the real moon that we are using as reference. That’s a no-go. If we need to select a new moon for Lharvion, that would be preferable compared to modifying the parameter. Is the problem that it will overlap other orbits?  I found lore that Barrakas and Therendor share similar orbits, leading to somewhat more frequent eclipses of Barracks by Therendor. We’ll need to closely match their inclinations, and I want to check on that.

Therendor being full while Barrakas is new has a particular magical confluence. Let’s add a term to their orbits that makes them weakly coupled to opposite phases. I would prefer they aren’t fully phase locked, but I don’t know how to do that math.

Dravago has an orbit that “typically keeps it at a distance from other moons”. I assume they don’t mean radius, so we definitely need one that has a higher inclination than any other.

I’d like to revisit our reference moons selections with these new details in mind. I also want to use scaled periods of these reference moons to the year length of Eberron. However, that will lead to really short synodic periods, so we’ll need to arbitrarily multiply those scaled periods. By default I’m thinking of integers, but open to ideas. Can you add that adjusted detail to the comparison table? (Basically exactly what we’re done with Zarantyr using Luna, but for the rest of the moons.)

Speaking of, Zarantyr has a unique interaction with weather: “superstition holds
that there is a far greater chance of being struck by lightning when Zarantyr is full, and that bolts can fall from a clear sky”. We can give a chance of lightning strikes regardless of the conditions being right for it? Just a flat boost of lightning (thunder?) storms. So it’s still more likely to be hit if there was also a storm, but clear skies are no  guarantee of safety.

And Zarantyr has the greatest affect on the tides, but all moons affect “wind and water”. So we can remove that wind/prec bonus from Zarantyr if we had it.

And finally, Aryth has a feature that it “has a similar effect on manifest zones as Zarantyr has on tides”. We don’t generate manifest zones at present. I’m not actually sure we should, because they tend to be very localized effects. I know we currently have a feature for Fernia and Risia - are those in the location system / the weather system? I think we should make it parallel to location. So you can set the location, and it doesn’t ask you about manifest zones. Below the “set location” button, there is a “set manifest zone” button, that presents a 2 column table with column A being names of the 12 options, plus a 13th option at the top of the list for “none”. We should also be able to set multiple manifest zones, so the buttons in column B for each zone should either say “On” or “Off” (so an active zone would have an “Off” button). The active zones in column A should be bolded, and the non-active zones should be slightly fainter text and italicized.

I’d like a GM reminder too that says, “Aryth is full. Consider a manifest zone.” Probably in any summary view that includes moons, below where it says Aryth is full. And store a small flag in state if any zone was activated on Aryth’s full moon, that when the date is advanced, a small warning appears saying “Aryth is no longer full, consider deactivating Manifest Zone(s): X, Y, Z, etc.”

Additionally, when location is changed, clear any manifest zones. And add a line to the location updated to X message that says “X, Y, Z Manifest Zone(s) cleared”. They’re location based.

We’ll populate those effects soon, but let’s wire in that mechanic now, with the temperature +/- we already have for Fernia and Risia being either coterminous or remote. (If we still had winds for Shavarath, please remove that entirely.) This status would be included in the “today” presentation that includes all active effects, weather,  full moons, new moons, present-day events, etc. We won’t use the forecasting mechanic for manifest zones, so players will always know when one is active, via the “today”. Players should be able to call !cal and have the basic calendar view, plus the buttons to access each additional calendar view (same as GM basically, though their information might be more limited), plus a “today” view that lists everything for the day. Is that what we have right now? 
A new detail about the ring of Siberys. It “stretches over the equator”. I don’t recall if we matched it on the equator or not. It “stands out even in the light of day”.
 A correction about the Calendar of Harptos. It uses “Tendays”, not weekdays. Each month is three tendays long, so each month should uses rows of 10 columns. The columns will be labeled 1st, 2nd, 3rd, 4th, 5th, 6th, 7th, 8th, 9th, and 10th (these are effectively the weekday labels). They don’t usually include weekdays in the date format, so the date format for Harptos will be “16th of X, YYYY DR” (they use Dalereckoning as the era label).

Here’s a todo list as well: Calendar To Do
Mundane/magical shifted to low, medium, high. Not implemented.
Today view includes extreme event even if one was not set yet. Today view should be reconfigured for less data. Too cluttered. I will direct this. Just flagging.
Check on solar eclipse math. Seems like some moons might be eclipsed multiple days in a row. Eclipses should have a time of day (early hours 0-6, morning 6-12, afternoon 12-5, evening 5-10, night 10-0 .
Same for moons crossing one another.
Hover tool tips needs line breaks between each entry
Bottom row of the minicals is cut off short (Y axis)
Tooltip moons include the moniker (they should not)
In the Moons minical, it’s way too cluttered. Ditch the cell shading for now. I will use it for something else. Include a yellow dot if a moon is full, and a black dot if at least one moon is new. That’s all.
Double check moons math. Seems we get multiple days of a full moon at once. Do we need to revisit the definition of full or new?
For the planes view, let’s set the bubbles as Green = Coterminous, Red = Remote, Up or down arrow for the rest, for waxing and waning.
When we highlight cells, we’re only highlighting the beginning or end of the period, but it should be all days in between.
