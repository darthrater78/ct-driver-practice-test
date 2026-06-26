/*
 * Connecticut Driver's Manual — Practice Test question bank
 * Source: State of Connecticut DMV Driver's Manual (Revised March 2023)
 *
 * Every question is grounded in the manual text. `page` is the manual's own
 * printed page number (not the PDF page index). `correct` is the index into
 * `options`. Questions 1-10 are the manual's official Study Questions, copied
 * verbatim, with answers taken from the official key on printed page 54.
 *
 * Accuracy is critical: do not edit an answer without re-checking the manual.
 */
const QUESTIONS = [
  // ---- Official Study Questions (verbatim; key from p.54) ----
  {
    q: "Worn tires can cause",
    options: ["Difficult turning", "Hydroplaning", "Increased stopping distance", "All of the above"],
    correct: 3, page: 13,
    why: "Worn or bald tires increase stopping distance, make turning harder on wet roads, and increase hydroplaning — so all of the above."
  },
  {
    q: "Which statement is false?",
    options: [
      "You should always check your seat and mirrors before you start to drive",
      "After market, any changes to equipment, such as tinted windows, are legal",
      "The driver should always have his or her seatbelt on",
      "Only your brakes can stop your vehicle"
    ],
    correct: 1, page: 13,
    why: "After-market changes such as tinted windows and lighting MAY violate legal standards, so calling them all legal is false."
  },
  {
    q: "When you hear an emergency vehicle approaching from any direction, you must",
    options: ["Slow down", "Pull to the right side of the road and stop", "Continue driving at the same speed", "Speed up"],
    correct: 1, page: 35,
    why: "You must pull over to the right edge of the road, stop, and remain stopped until the emergency vehicle has passed."
  },
  {
    q: "The No-Zone area is",
    options: [
      "An area where pedestrians cannot cross the street",
      "An area where vehicles are not allowed to park",
      "The danger areas around a truck where there are blind spots for the driver",
      "None of the above"
    ],
    correct: 2, page: 35,
    why: "No-Zones are the danger areas around a large truck — including blind spots — where crashes are more likely."
  },
  {
    q: "At a four way stop",
    options: [
      "The vehicle on the left goes first",
      "You do not have to stop if there are no other vehicles around",
      "The vehicle on the right goes first",
      "School buses go first"
    ],
    correct: 2, page: 41,
    why: "The first to arrive goes first; if vehicles arrive at the same time, the vehicle on the right goes first."
  },
  {
    q: "When you change lanes you should",
    options: [
      "Look over your shoulder in the direction you plan to move",
      "Blow your horn before changing lanes",
      "Cross two or more lanes at one time",
      "Flash your headlights"
    ],
    correct: 0, page: 42,
    why: "Mirrors do not show your blind spots — you must turn your head and look over your shoulder before changing lanes."
  },
  {
    q: "If an approaching vehicle fails to dim their headlights, you should",
    options: [
      "Look to the center of the road",
      "Flash your headlights quickly a couple of times",
      "Keep your bright lights on",
      "Turn your headlights off"
    ],
    correct: 1, page: 42,
    why: "Flash your headlights quickly a couple of times; if the driver still does not dim, look toward the right edge of the road."
  },
  {
    q: "A Pentagon shaped sign means",
    options: ["There is a railroad crossing", "There is a No Passing Zone", "There is a school zone", "You must yield"],
    correct: 2, page: 52,
    why: "The five-sided pentagon shape marks school zones and warns of school crossings."
  },
  {
    q: "Green road signs are",
    options: ["Regulatory signs", "Guide signs", "Warning signs", "Used for parks and recreation"],
    correct: 1, page: 52,
    why: "Green is used for guide signs — they tell you where you are, which way to go, and the distance."
  },
  {
    q: "Solid yellow lines between lanes indicates",
    options: [
      "Only cars on one side of the lane may pass",
      "You may change lanes if you choose to do so",
      "Passing is not allowed",
      "None of the above"
    ],
    correct: 2, page: 52,
    why: "Solid yellow center lines indicate passing is not allowed."
  },

  // ---- Chapter 1: Obtaining a license ----
  {
    q: "To obtain a learner's permit, you must be at least how old?",
    options: ["15 years old", "16 years old", "18 years old", "21 years old"],
    correct: 1, page: 5,
    why: "You must be at least 16 years of age to obtain a learner's permit."
  },
  {
    q: "The knowledge test has 25 questions. How many correct answers do you need to pass?",
    options: ["15", "18", "20", "All 25"],
    correct: 2, page: 5,
    why: "The knowledge test consists of 25 questions and you need 20 correct answers to pass."
  },
  {
    q: "The minimum vision requirement for all classes of license is at least",
    options: ["20/20", "20/40", "20/60", "20/100"],
    correct: 1, page: 5,
    why: "The minimum vision requirement for all classes is at least 20/40, with or without glasses or contact lenses."
  },
  {
    q: "A learner's permit is valid until you obtain a license or, whichever comes first,",
    options: ["6 months from issue", "1 year from issue", "2 years from issue", "5 years from issue"],
    correct: 2, page: 5,
    why: "The permit is valid until you obtain a driver's license or 2 years from the date it is issued, whichever comes first."
  },
  {
    q: "An applicant 18 years of age or older must hold a learner's permit for at least how long before taking a road test?",
    options: ["30 days", "60 days", "90 days", "180 days"],
    correct: 2, page: 7,
    why: "A person 18 or older must hold a learner's permit for at least 90 days prior to taking a road test."
  },
  {
    q: "How much must you pay for a license after you pass the road test?",
    options: ["$30", "$50", "$84", "$100"],
    correct: 2, page: 8,
    why: "You must pay $84 for a license after you pass the road test."
  },

  // ---- Chapter 1: Teen restrictions ----
  {
    q: "What are the curfew (hour restriction) hours for 16- and 17-year-old drivers?",
    options: ["10 p.m. to 6 a.m.", "11 p.m. to 5 a.m.", "12 a.m. to 5 a.m.", "11 p.m. to 6 a.m."],
    correct: 1, page: 8,
    why: "16- and 17-year-old drivers may not drive between 11 p.m. and 5 a.m. (with limited exceptions such as work, school, or medical necessity)."
  },
  {
    q: "During the FIRST six months with a license, a 16- or 17-year-old driver may carry as passengers only",
    options: [
      "A parent/legal guardian or one qualified licensed adult",
      "Up to three friends",
      "Members of the immediate family",
      "Anyone, as long as there are enough seatbelts"
    ],
    correct: 0, page: 8,
    why: "In the first six months only a licensed instructor, a parent/legal guardian, or one qualified adult (20+, licensed 4+ years) may ride along. Immediate family is allowed only in the second six months."
  },
  {
    q: "16- and 17-year-old drivers and learner's permit holders may use a hands-free cell phone while driving.",
    options: ["True", "False — they may not use any type of cell phone or mobile device", "True, but only for emergency calls", "True, but only when stopped at a light"],
    correct: 1, page: 13,
    why: "Drivers who are 16 or 17 are not permitted to use any type of cell phone or mobile electronic device, including a hands-free device."
  },

  // ---- Chapter 2: Before you get behind the wheel ----
  {
    q: "What is the fine if a driver or passenger fails to wear a seat belt?",
    options: ["$25", "$50", "$75", "$100"],
    correct: 2, page: 12,
    why: "If the driver or a passenger fails to wear a seat belt, each could be cited and fined $75."
  },
  {
    q: "Connecticut law requires children under what age to be secured in a proper child restraint and safety system?",
    options: ["Under 8", "Under 12", "Under 16", "Under 18"],
    correct: 2, page: 12,
    why: "State law requires children under 16 to be secured in a proper child restraint and safety system while riding in a vehicle."
  },
  {
    q: "A child under age 2, or weighing less than 30 pounds, must ride in a",
    options: ["Booster seat", "Rear-facing-only car seat (or rear-facing convertible with 5-point harness)", "Forward-facing child restraint", "Regular seat belt"],
    correct: 1, page: 12,
    why: "Children under age 2 or under 30 pounds must use a rear-facing-only car seat or a rear-facing convertible seat with a 5-point harness."
  },
  {
    q: "Connecticut law requires continuous ________ on any registered vehicle.",
    options: ["Insurance coverage", "Emissions testing", "Registration renewal", "Roadside assistance"],
    correct: 0, page: 13,
    why: "Connecticut law requires continuous insurance coverage on any registered vehicle; failure can result in suspension of the registration."
  },

  // ---- Chapter 3: Driving behaviors ----
  {
    q: "Safer drivers tend to look at least how far ahead of their vehicle?",
    options: ["2 seconds", "4 seconds", "12 seconds", "20 seconds"],
    correct: 2, page: 14,
    why: "Safer drivers tend to look at least 12 seconds ahead — about one block in the city or a quarter mile on the highway."
  },
  {
    q: "When passing a bicyclist, you must allow a minimum distance of",
    options: ["1 foot", "2 feet", "3 feet", "5 feet"],
    correct: 2, page: 17,
    why: "You must give a minimum of three feet of distance between your vehicle and a bicycle when passing."
  },
  {
    q: "When approaching an ice cream truck with flashing lights and an extended stop arm, you must stop at least how far from the truck?",
    options: ["5 feet", "10 feet", "20 feet", "25 feet"],
    correct: 1, page: 18,
    why: "You must stop at least 10 feet from the front or back of an ice cream truck displaying flashing lights and a stop signal arm."
  },
  {
    q: "The \"three-second rule\" is used to measure",
    options: ["Your following distance behind the vehicle ahead", "Your reaction time", "How long to signal before a turn", "The distance needed to pass"],
    correct: 0, page: 21,
    why: "The three-second rule tells you whether you are following too closely; it works at any speed."
  },
  {
    q: "Any time you want to merge with other traffic, you need an opening of about",
    options: ["2 seconds", "4 seconds", "6 seconds", "10 seconds"],
    correct: 1, page: 20,
    why: "You need an opening of about four seconds to merge, giving both you and the vehicle behind a two-second following distance."
  },
  {
    q: "At a speed of 55 mph, about how many seconds do you need to pass another vehicle?",
    options: ["4 seconds", "6 seconds", "10 seconds", "15 seconds"],
    correct: 2, page: 23,
    why: "At 55 mph you need about a 10-second opening in oncoming traffic to pass safely — over 1,600 feet."
  },
  {
    q: "It is illegal to back your vehicle in a travel lane EXCEPT to",
    options: [
      "Let out a passenger",
      "Parallel park or perform a three-point (K) turn",
      "Turn around after missing your exit",
      "Move out of the way of a breakdown"
    ],
    correct: 1, page: 24,
    why: "Never back in a travel lane except to parallel park or to perform a three-point or K turn. If you miss your exit, go on and turn around safely."
  },

  // ---- Chapter 3/4: Hazardous conditions & alcohol ----
  {
    q: "When it is raining, most tires have good traction up to about what speed before hydroplaning becomes a risk?",
    options: ["25 mph", "35 mph", "45 mph", "55 mph"],
    correct: 1, page: 25,
    why: "Most tires have good traction up to about 35 mph on wet roads; faster than that, tires can start to ride up on the water (hydroplane)."
  },
  {
    q: "On a wet road, you should reduce your speed by about",
    options: ["5 mph", "10 mph", "20 mph", "Half your speed"],
    correct: 1, page: 25,
    why: "On a wet road you should reduce your speed by about 10 mph."
  },
  {
    q: "On packed snow, you should",
    options: ["Reduce your speed by 10 mph", "Cut your speed in half", "Slow to a crawl", "Maintain the posted speed"],
    correct: 1, page: 25,
    why: "On packed snow you should cut your speed in half. (On ice, you must slow to a crawl.)"
  },
  {
    q: "Studded tires are permitted in Connecticut during which period?",
    options: ["November 15 through April 30", "All year", "December 1 through March 1", "October 1 through May 1"],
    correct: 0, page: 25,
    why: "Studded tires are permitted in Connecticut from November 15th through April 30th."
  },
  {
    q: "If your vehicle begins to skid, you should",
    options: [
      "Brake hard and hold the pedal down",
      "Stay off the brake and steer in the direction you want to go",
      "Steer in the opposite direction of the skid",
      "Accelerate to regain traction"
    ],
    correct: 1, page: 40,
    why: "Stay off the brake (it can make the skid worse) and steer in the direction you want the vehicle to go, correcting as it straightens out."
  },
  {
    q: "For drivers under 21, the \"zero tolerance\" law sets the blood alcohol limit at",
    options: [".00%", ".02%", ".05%", ".08%"],
    correct: 1, page: 34,
    why: "Drivers under 21 are subject to zero tolerance: a BAC of .02% or more results in penalties."
  },
  {
    q: "If you fail a blood, breath, or urine (BAC) test, your operator's license will be suspended for at least",
    options: ["30 days", "45 days", "90 days", "6 months"],
    correct: 1, page: 33,
    why: "If you fail the test, your operator's license will be suspended for at least 45 days, and an ignition interlock device will be required."
  },
  {
    q: "Alcohol is involved in more than what percentage of traffic crashes in which someone is killed?",
    options: ["10 percent", "20 percent", "40 percent", "60 percent"],
    correct: 2, page: 33,
    why: "Alcohol is involved in more than 40 percent of the traffic crashes in which someone is killed."
  },
  {
    q: "What is the only thing that will sober you up after drinking alcohol?",
    options: ["Coffee", "A cold shower", "Time", "Fresh air and exercise"],
    correct: 2, page: 33,
    why: "There is no way to sober up quickly — coffee, fresh air, exercise, and cold showers do not help. Time is the only thing that will sober you up."
  },

  // ---- Chapter 4/5: Rules of the road, signals & signs ----
  {
    q: "A flashing red traffic light means",
    options: ["The same as a stop sign — come to a full stop", "Slow down and proceed with caution", "Yield to traffic on the left", "Proceed without stopping"],
    correct: 0, page: 45,
    why: "A flashing red traffic light means the same as a stop sign: come to a full stop and proceed when it is safe."
  },
  {
    q: "A flashing yellow traffic light means",
    options: ["Stop and wait", "Slow down and proceed with caution", "Speed up to clear the intersection", "The light is broken — treat as a stop sign"],
    correct: 1, page: 45,
    why: "A flashing yellow traffic light means slow down and proceed with caution."
  },
  {
    q: "A steady yellow traffic light means",
    options: ["Speed up to beat the red", "The light is about to turn red — stop if it is safe to do so", "Yield to pedestrians only", "Go — the light just turned"],
    correct: 1, page: 45,
    why: "A yellow light means the signal is about to change to red; you must stop if it is safe. If you are already in the intersection, continue through."
  },
  {
    q: "An octagonal (eight-sided) sign always means",
    options: ["Yield", "Stop", "Warning", "School zone"],
    correct: 1, page: 46,
    why: "The octagon (eight-sided) shape always means STOP."
  },
  {
    q: "A downward-pointing triangle sign means",
    options: ["Stop", "Yield", "No passing", "Railroad crossing"],
    correct: 1, page: 46,
    why: "The triangle (downward-pointing) shape means YIELD — slow down and yield the right-of-way, stopping if necessary."
  },
  {
    q: "Diamond-shaped signs are",
    options: ["Regulatory signs", "Guide signs", "Warning signs", "Service signs"],
    correct: 2, page: 46,
    why: "Diamond-shaped signs warn you of special conditions or hazards ahead."
  },
  {
    q: "Orange signs are used to",
    options: ["Mark parks and recreation areas", "Warn of construction and maintenance work zones", "Give route and distance information", "Show services along the road"],
    correct: 1, page: 47,
    why: "Orange is used for warning signs that alert you to possible dangers ahead due to construction and maintenance projects."
  },
  {
    q: "Blue guide signs tell you about",
    options: ["Services along the roadway", "Parks and recreation areas", "Distances to cities", "Traffic regulations"],
    correct: 0, page: 47,
    why: "Blue is used for guide signs that tell you about services along the roadway (rest areas, gas, hospitals, etc.)."
  },
  {
    q: "A white, X-shaped \"crossbuck\" railroad sign has the same meaning as a",
    options: ["Stop sign", "Yield sign", "Do Not Enter sign", "Warning sign"],
    correct: 1, page: 52,
    why: "The railroad crossbuck has the same meaning as a Yield sign — you must yield to crossing trains."
  },
  {
    q: "When a school bus is stopped with its red lights flashing, you must",
    options: [
      "Stop only if you are directly behind the bus",
      "Stop whether it is on your side, the opposite side, or at an intersection ahead (unless a median/barrier separates oncoming lanes)",
      "Slow down but you may pass carefully",
      "Continue at normal speed if no children are visible"
    ],
    correct: 1, page: 36,
    why: "You must stop for a school bus with red lights flashing on your side, the opposite side, or at an intersection ahead. You need not stop only if the bus is traveling toward you and a median or physical barrier separates the roadway."
  },
  {
    q: "Pedestrians using a guide dog or carrying a white cane have",
    options: ["The right-of-way only in marked crosswalks", "Absolute right-of-way", "The right-of-way only at traffic signals", "No special right-of-way"],
    correct: 1, page: 36,
    why: "Pedestrians using a guide dog or carrying a white cane have absolute right-of-way. Do not use your horn, as it could confuse or frighten them."
  }
];

// Export for Node (test harness) while staying a plain global in the browser.
if (typeof module !== "undefined" && module.exports) {
  module.exports = QUESTIONS;
}
