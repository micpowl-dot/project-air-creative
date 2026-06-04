# Photo Booth → Live Wall (setup)

> **Tracker:** D6-01 (photo station + QR intake) + the photo feed for the wall.
> **Goal:** attendee scans a QR at the balloon arch → uploads a photo → it appears
> on the live wall (https://ai-day-board.vercel.weather.com/wall) with their @handle.
> **No SES, no n8n, no AWS.** All Google Workspace + one Apps Script.

## How it flows
1. **Google Form** (photo upload + auto-captured work email) = the QR target.
2. **Apps Script** on the form: on each submit, makes the photo link-viewable and
   adds `{ src, handle }` to a list (handle derived from the email, e.g.
   michael.powell@weather.com → `@michael.powell`).
3. The script publishes that list as JSON at a **web-app URL**.
4. Set the wall's **`WALL_IMAGES_URL`** env var to that URL. Done, photos go live.

The wall reads the URL server-side, so there's no CORS or login issue on the TV.

## Step 1 — Build the Form
1. forms.google.com → blank form, title "AI Day Photo Booth."
2. Settings → **Collect email addresses = On** (Workspace fills it automatically).
3. Add one question, type **File upload** → "Add your photo" → limit to **images**,
   1 file. (Respondents must be signed in to Workspace, which they are.)
4. Send → copy the form link. Generate a **QR code** from that link (any QR tool)
   for the photo-station signage.

## Step 2 — Add the Apps Script
In the Form: top-right **⋮ → Script editor**. Paste this, save, run `setup()` once
(authorize when prompted):

```javascript
/**
 * AI Day Photo Booth feed. Bind to the GOOGLE FORM (Form > ⋮ > Script editor).
 * Run setup() once. Then Deploy > New deployment > Web app
 * (Execute as: Me, Who has access: Anyone). Put the /exec URL in WALL_IMAGES_URL.
 * Form must have "Collect email addresses" on + one File upload question.
 */
const MAX_IMAGES = 300;
const PROP_KEY = 'wallImages';

function setup() {
  const form = FormApp.getActiveForm();
  const has = ScriptApp.getProjectTriggers().some(t => t.getHandlerFunction() === 'onFormSubmit');
  if (!has) ScriptApp.newTrigger('onFormSubmit').forForm(form).onFormSubmit().create();
}

function onFormSubmit(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const resp = e.response;
    const email = (resp.getRespondentEmail() || '').toLowerCase();
    const handle = email ? '@' + email.split('@')[0] : '';
    const ids = [];
    resp.getItemResponses().forEach(ir => {
      if (ir.getItem().getType() === FormApp.ItemType.FILE_UPLOAD) {
        (ir.getResponse() || []).forEach(id => ids.push(id));
      }
    });
    const list = loadList();
    ids.forEach(id => {
      try {
        DriveApp.getFileById(id).setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch (err) {}
      list.push({ src: 'https://lh3.googleusercontent.com/d/' + id, handle: handle });
    });
    saveList(list);
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  const images = loadList().slice().reverse().slice(0, MAX_IMAGES);
  return ContentService.createTextOutput(JSON.stringify({ images: images }))
    .setMimeType(ContentService.MimeType.JSON);
}

function loadList() {
  const raw = PropertiesService.getScriptProperties().getProperty(PROP_KEY);
  try { return raw ? JSON.parse(raw) : []; } catch (e) { return []; }
}
function saveList(list) {
  PropertiesService.getScriptProperties().setProperty(PROP_KEY, JSON.stringify(list.slice(-MAX_IMAGES)));
}
```

## Step 3 — Publish + connect
1. In the script editor: **Deploy → New deployment → Web app.**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Deploy, copy the **/exec URL**.
2. In Vercel (ai-day-board → Settings → Environment Variables): add
   **`WALL_IMAGES_URL`** = that /exec URL. Redeploy.
3. Submit one test photo through the Form, it should appear on `/wall` within ~8s.

## Notes
- Form file uploads land in an auto-created Drive folder ("AI Day Photo Booth
  (File responses)"). The script just makes each photo link-viewable; we don't
  need to move them. (If you'd rather they collect in the
  "AI Day - Live Wall (uploads)" folder, point the Form's response folder there.)
- @handle comes from the work email local-part. If you'd rather show display
  names, we can map emails to names.
- Personal email follow-up (D6-04) is dropped for v1 per Maigh, self-serve pickup
  from the folder via QR instead. Can be added later in the same script with
  `MailApp.sendEmail(...)` (Workspace send, no AWS).
