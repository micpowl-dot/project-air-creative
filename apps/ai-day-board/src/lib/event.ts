// The one place the event date is written.
//
// It used to be typed by hand into the wall masthead, the wall footer, the booth
// screens, the prompts screen, the printable sign and the page metadata. Six
// copies of "June 9, 2026" survived into the August run, so every monitor and
// every phone would have advertised the wrong date for the two weeks leading up
// to it. Change it here and every surface follows.

/** Event date as shown to people. Keep it one line: it sits in tight layouts. */
export const EVENT_DATE_LABEL = "August 19, 2026";

/**
 * Company name joined by non-breaking spaces (U+00A0), so a narrow screen can
 * never wrap it mid-phrase. Looks like a normal space, never breaks.
 */
export const COMPANY_LABEL = "The Weather Company";
