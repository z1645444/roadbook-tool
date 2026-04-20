# Feature Landscape: Chat-First Cycling Roadbook Planner

**Domain:** Cycling route + roadbook planning (China-first, AMap-backed)  
**Researched:** 2026-04-20  
**Overall confidence:** MEDIUM-HIGH (market patterns are strong; chat-first prioritization is product-inference)

## Table Stakes (must have, or users leave)

| Feature | Why Expected | Complexity | Recommendation |
|---|---|---|---|
| Conversational trip intake (start/end/waypoints + clarifying questions) | Chat-first product must collect structured constraints without forms | Medium | Build in v1 |
| Route builder with waypoint editing and reordering support | Core planner behavior across Strava/Ride with GPS/komoot | High | Build in v1 |
| Segment/day metrics (distance, duration, climbing/elevation) | Riders evaluate feasibility before riding | Medium | Build in v1 |
| Turn cues in roadbook output | Navigation-ready directions are baseline expectation | Medium | Build in v1 |
| Multi-day stage planning | Roadbook use case requires day-by-day itinerary | High | Build in v1 |
| Overnight stop support (nearby lodging candidates at day endpoints) | Roadbook planners are expected to be execution-ready, not map-only | Medium | Build in v1 |
| Export/share artifact (Markdown + GPX) | Cyclists use bike computers/apps; lock-in is not accepted | Medium | Build in v1 |
| Re-editable saved plans | Route planning is iterative; one-shot output is insufficient | Medium | Build in v1 |

## Differentiators (valuable, but can be deferred)

| Feature | Value Proposition | Complexity | Defer Guidance |
|---|---|---|---|
| Constraint-aware auto optimization (waypoint sequence + day split in one pass) | Reduces manual replanning; strongest “AI planner” signal | High | Phase 2 |
| Rider-profile personalization (history-based pace/intensity) | More realistic ETAs and daily load | High | Phase 2 |
| Weather/wind-aware replanning | Better safety/comfort; strong premium feel | High | Phase 3 |
| Surface/safety preference routing (paved/gravel/traffic aversion) | Better route quality for specific rider types | High | Phase 2 |
| One-click sync to Garmin/Wahoo/Hammerhead | Less friction vs file export | Medium | Phase 2 |
| Collaborative planning + version history | Useful for group tours; not required for solo MVP | Medium | Phase 3 |
| Rich POI intelligence (water, repair, food reliability scoring) | Better on-road resilience and trust | Medium | Phase 2 |

## Anti-Features (deliberately do not build now)

| Anti-Feature | Why Avoid | What to Do Instead |
|---|---|---|
| Social feed/segments/challenges | Large scope, low leverage for planning validation | Export/share links only |
| Full in-app navigation stack (real-time guidance, offline maps engine) | Reinvents mature bike computer/mobile nav ecosystems | Provide strong cues + GPX/export + device sync later |
| Global map-provider parity in v1 | Slows delivery and increases failure modes | Keep AMap-first; abstract provider interface for v2 |
| OTA integrations for every device vendor in v1 | High integration/test burden | Start with GPX/TCX compatibility, then top-device sync |
| Booking/payment engine for lodging | Changes product from planner to OTA business | Keep recommendation + external booking handoff |

## Feature Dependencies

```text
Conversational intake
  -> Geocoding + route planning
  -> Segment metrics + cues
  -> Multi-day stage split
  -> Roadbook renderer (Markdown/GPX)

Multi-day stage split
  -> Overnight endpoint selection
  -> Lodging candidate retrieval + filtering

Route geometry + steps
  -> Turn cues
  -> Device-compatible export

Saved plans
  -> Collaboration/version history (deferred)
  -> Personalization feedback loop (deferred)
```

## MVP Recommendation (requirements input)

Prioritize now:
1. Conversational intake + constraint capture
2. Route generation with waypoint handling
3. Day-by-day roadbook generation with cues and metrics
4. Overnight lodging shortlist near day endpoints
5. Markdown + GPX export and plan re-edit

Defer:
- Weather/wind and advanced safety optimization
- Deep personalization from ride history
- Collaboration/version history
- Native multi-vendor device sync beyond basic exports

## Sources

- Komoot, multi-day route planning (updated 2026-03-02): https://support.komoot.com/hc/en-us/articles/4410595058202-Edit-multi-day-Tours
- Strava, route creation preferences and saved routes (updated 2026-03-03, 2026-02-02):  
  https://support.strava.com/hc/en-us/articles/216918387-Routes-on-Web  
  https://support.strava.com/hc/en-us/articles/12137015315085-Saved-Routes-on-Web
- Strava, route following + GPX/TCX export (updated 2026-02-04): https://support.strava.com/hc/en-us/articles/360044071592-Following-a-Route
- Ride with GPS, advanced planner + cuesheets + waypoints + export formats (updated 2026-01 to 2026-04):  
  https://support.ridewithgps.com/hc/en-us/articles/4415470200859-Advanced-Route-Planning/  
  https://support.ridewithgps.com/hc/en-us/articles/4419011474843-Cuesheets  
  https://support.ridewithgps.com/hc/en-us/articles/36795897776411-Waypoints  
  https://support.ridewithgps.com/hc/en-us/articles/4419007646235
- Garmin support, third-party course imports and device handoff:  
  https://support.garmin.com/en-US/?faq=wKuZXCaZRP4mWPX5aRz5h5
- AMap official API docs for cycling routing and nearby POI/lodging fields:  
  https://amap.apifox.cn/api-14569242  
  https://amap.apifox.cn/api-14650116

