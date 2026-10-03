import type { FaqEntry } from "@/lib/seo/schema";

/**
 * FAQ for the energy tools. Answers rely only on the formulas on each page
 * and on facts that hold everywhere (1 unit = 1 kWh); none quote tariffs.
 */

export const unitCalculatorFaq: readonly FaqEntry[] = [
  {
    question: "What is one unit of electricity?",
    answer:
      "One unit on an electricity bill is one kilowatt-hour (kWh): the energy used by something drawing 1,000 watts for one hour, or 100 watts for ten hours.",
  },
  {
    question: "How do I calculate units from my meter reading?",
    answer:
      "Subtract the previous reading from the current reading. The difference is the number of units (kWh) used between the two readings.",
  },
  {
    question: "Why is my current reading lower than my previous reading?",
    answer:
      "Check that both readings are from the same meter and that you read the kWh display. If your meter was replaced, work out the units on each meter separately and add them. Contact your provider if you are unsure.",
  },
  {
    question: "Why are my units different from the units on my bill?",
    answer:
      "Your bill uses the provider’s own readings, taken on its reading dates. Readings you take on other days cover a different number of days, so the units will differ.",
  },
  {
    question: "How is the monthly figure estimated?",
    answer:
      "The calculator divides your units by the number of days between the readings to get a daily average, then multiplies it by 30. It assumes you keep using electricity at the same rate.",
  },
  {
    question: "Can I turn these units into a bill amount?",
    answer:
      "Yes. Enter the units in the electricity bill calculator, which applies the official tariff slabs and adjustments for your provider and consumer type.",
  },
];

export const applianceCalculatorFaq: readonly FaqEntry[] = [
  {
    question: "How do I calculate how many units an appliance uses?",
    answer:
      "Multiply the power in watts by the number of hours it runs and divide by 1,000. The result is kilowatt-hours (units) per day. Multiply by the days you use it to get units per month.",
  },
  {
    question: "Where do I find an appliance’s wattage?",
    answer:
      "Look at the rating label or plate on the appliance, its box or its manual. It is usually printed as W or kW. If it shows only volts (V) and amps (A), multiplying them gives a rough figure that is often higher than the real power.",
  },
  {
    question: "Why is the result higher than what my appliance really uses?",
    answer:
      "The calculator assumes the appliance draws its full rated power for every hour you enter. Fridges, ACs, irons and similar appliances switch on and off by themselves, so their real use is usually lower.",
  },
  {
    question: "What rate per unit should I use?",
    answer:
      "There is no single rate for every home. Your rate depends on your tariff slab, which depends on your household’s total monthly units, plus monthly adjustments and taxes. You can divide your last bill’s total by its units, or pick your slab from the official tariff list in the calculator.",
  },
  {
    question: "Does the estimated cost include taxes and fixed charges?",
    answer:
      "No. The cost is units multiplied by the rate you enter. Fixed charges, taxes and other items on your bill are not included unless they are already part of the rate you type in.",
  },
  {
    question: "Can I add more than one appliance?",
    answer:
      "Yes. Add each appliance separately with its own power, quantity, hours and days. The result shows the total and each appliance’s share.",
  },
];

export const acCalculatorFaq: readonly FaqEntry[] = [
  {
    question: "How many units does an AC use per hour?",
    answer:
      "Units per hour equal the AC’s input power in kilowatts while it runs. An AC drawing 1,500 watts uses 1.5 units in an hour at that power. Check your AC’s rating label for its input power.",
  },
  {
    question: "Can I use tons or BTU instead of watts?",
    answer:
      "No. Tons and BTU/h describe cooling capacity, not electricity used. One ton of cooling is 12,000 BTU/h, about 3.5 kW of heat removed, but the electricity an AC draws to do that varies by model. Use the input power from the rating label instead.",
  },
  {
    question: "Does an inverter AC use less electricity?",
    answer:
      "An inverter AC changes its compressor speed instead of switching fully on and off, so its power draw varies. How much it uses compared with another AC depends on the models, the room and how it is used. This calculator does not assume any saving; enter your own AC’s rated input power.",
  },
  {
    question: "What does “time at rated power” mean?",
    answer:
      "It is the share of switched-on time the AC draws its rated input power. 100% assumes full power for every hour it is on. If you have measured your AC’s actual use, for example with a plug-in energy meter, you can lower it to match.",
  },
  {
    question: "Why is my bill different from this estimate?",
    answer:
      "Your bill includes every appliance in your home, applies tariff slabs to your total units, and adds fixed charges, adjustments and taxes. This calculator estimates the AC’s own units and multiplies them by the rate you enter.",
  },
];

export const touCalculatorFaq: readonly FaqEntry[] = [
  {
    question: "What is a time-of-use (TOU) electricity bill?",
    answer:
      "On a time-of-use tariff, units used during the evening peak hours are charged at a higher rate than units used at other times (off-peak). A TOU meter records the two separately, so the bill shows peak and off-peak units instead of one total.",
  },
  {
    question: "Who is billed on a time-of-use tariff?",
    answer:
      "Under the tariff terms, residential and commercial connections with a sanctioned load of 5 kW and above are given a TOU meter and billed on the time-of-use tariff: A-1(b) for residential and A-2(c) for commercial. Smaller connections are billed on slabs; use the electricity bill calculator for those.",
  },
  {
    question: "What is MDI and why does it change my fixed charges?",
    answer:
      "MDI is the maximum demand, in kW, that your meter recorded during the month. TOU fixed charges are charged per kW of billing demand: the higher of a share of your sanctioned load (50% for residential, 25% for commercial) and your MDI. A higher MDI means higher fixed charges.",
  },
  {
    question: "Where do I find my peak and off-peak units?",
    answer:
      "A TOU meter records peak and off-peak units separately, and your bill lists them. Enter the units for the bill month you are estimating. You do not need to know the peak hours to use this calculator.",
  },
  {
    question: "Does the estimate include the fuel charges adjustment and quarterly adjustment?",
    answer:
      "Yes, where NEPRA has notified them for the bill month you choose. They are added on all units, peak and off-peak alike. If an adjustment has not been notified yet, the result says “not yet notified” and does not guess it.",
  },
  {
    question: "Does the estimate include taxes?",
    answer:
      "No. General Sales Tax, electricity duty and other taxes depend on your circumstances and are not included, so your actual bill will be higher than this estimate.",
  },
];
