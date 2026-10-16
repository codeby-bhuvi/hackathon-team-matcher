# Hackathon Team Matcher: API Reference

Base URL while developing: `http://localhost:5000`

## Basics

- All request and response bodies are JSON.
- Every endpoint except **signup** and **login** needs the header:
  `Authorization: Bearer <token>`
- The token comes from `POST /api/auth/login`. It lasts 7 days.
- Errors always look like `{ "error": "message" }`, so the message can be shown directly.
- Common status codes:
  - `400` bad or missing input
  - `401` not logged in, or token invalid or expired (send the user to the login screen)
  - `403` logged in but not allowed
  - `404` not found (this also covers hidden posts for normal users)
  - `409` conflict (duplicate, already on a team, already answered, and so on)
- Roles: `USER` and `ADMIN`. Show the Admin page only when `user.role === "ADMIN"`.
- Dates are sent as text like `2026-11-20` and come back as full timestamps.

## Running the backend locally

1. `cd Backend`, then `npm install`
2. Create a `.env` file in `Backend` with:
   ```
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/hackathon_matcher"
   JWT_SECRET="any-long-random-string"
   REPORT_THRESHOLD=2
   ```
3. Create an empty database called `hackathon_matcher` in PostgreSQL.
4. `npx prisma migrate dev` then `npx prisma generate`
5. `npm run dev` (the server runs on port 5000)

CORS currently allows `http://localhost:5173` and `http://localhost:3000`.

---

## Auth

### POST /api/auth/signup  (no token)
Sends: `name`, `email`, `password` (min 8 characters), `city`, `college`, optional `skills` (list of text)
Returns: `201` and `{ id, name, email, city, college, skills, role }`
Errors: `400` missing fields or short password, `409` email already registered

### POST /api/auth/login  (no token)
Sends: `email`, `password`
Returns: `200` and `{ token, user: { id, name, email, city, college, skills, role } }`
Errors: `400` missing fields, `401` wrong email or password

### GET /api/auth/me
Returns: `200` and `{ id, name, email, city, college, bio, skills, role, contact, pastHackathons, projects }`
Errors: `401`, `404`

---

## Users and profiles

### PUT /api/users/me
Sends any of: `name`, `city`, `college` (cannot be empty), `bio`, `contact` (an empty value clears it), `skills` (list). Only the fields sent are changed.
Returns: `200` and `{ id, name, email, city, college, bio, contact, skills, role }`
Errors: `400` empty field, skills not a list, or nothing to update

### GET /api/users/:id
Public profile, logged-in members only.
Returns: `200` and `{ id, name, city, college, bio, skills, role, createdAt, pastHackathons, projects }`
`pastHackathons` items: `{ id, name, year, result }` (newest first). `projects` items: `{ id, title, description, link }`.
Email and contact are never included here.
Errors: `400` bad id, `404`

### POST /api/users/me/past-hackathons
Sends: `name`, `year` (2000 or later), optional `result`
Returns: `201` and the entry. Maximum 20 per person.
Errors: `400`

### DELETE /api/users/me/past-hackathons/:id
Returns: `200` and `{ message }`
Errors: `404` if it is not the person's own entry

### POST /api/users/me/projects
Sends: `title`, optional `description`, optional `link` (must start with http:// or https://)
Returns: `201` and the entry. Maximum 20 per person.
Errors: `400`

### DELETE /api/users/me/projects/:id
Returns: `200` and `{ message }`
Errors: `404` if it is not the person's own entry

---

## Hackathons

`mode` is one of `ONLINE`, `IN_PERSON`, `HYBRID`.

### POST /api/hackathons
Sends: `name`, `organizer`, `link` (starts with http), `mode`, `startDate`, `endDate`, `deadline` (registration deadline), `minTeamSize`, `maxTeamSize`, optional `description`. `city` is required unless `mode` is `ONLINE`.
Returns: `201` and the hackathon
Errors: `400` (missing fields, bad link, bad dates, end before start, max smaller than min)

### GET /api/hackathons
Optional query: `city`, `q` (search in the name), `includePast=true`
By default, hackathons past their registration deadline and hidden ones are left out. Nearest deadline first.
Returns: `200` and a list. Each item has the hackathon fields plus `postedBy: { id, name }`.

### GET /api/hackathons/:id
Returns: `200` and the hackathon with `postedBy: { id, name }`
Errors: `400` bad id, `404` (missing or hidden)

### POST /api/hackathons/:id/report
Sends: optional `reason`
Returns: `201` and `{ message }`
Once enough people report a post, it is hidden automatically and will give `404` from then on.
Errors: `400` own post, `404` missing or already hidden, `409` already reported by this person

---

## Teams

### POST /api/teams
Creates an incomplete team. The creator becomes the leader and the first member.
Sends: `hackathonId`, `name`, `skillsNeeded` (list), `spotsNeeded` (whole number, at least 1, and at most `maxTeamSize - 1`)
Returns: `201` and the team with `leader` and `members`
Errors: `400` (bad input, deadline passed, too many spots), `404` hackathon not found, `409` already on a team for this hackathon

### GET /api/teams
Query: `hackathonId` (required), optional `includeFull=true`
Returns: `200` and a list of teams with open spots, each with `leader` and `members` (id and name). Newest first.
Errors: `400`, `404`

### GET /api/teams/:id
Returns: `200` and `{ id, name, skillsNeeded, spotsNeeded, hackathon: { id, name }, leader, members, isMember }`
Each member is `{ id, joinedAt, user: { id, name, city, college, skills, contact? } }`.
**`contact` only appears when `isMember` is true.** Show contact details only if the field is present.
Errors: `400`, `404`

---

## Solo members (people looking for a team)

### POST /api/solo
Sends: `hackathonId`, optional `note`
Returns: `201` and the entry with `user: { id, name, city, college, skills }`
Errors: `400` (bad input, deadline passed), `404`, `409` already on a team or already listed

### GET /api/solo
Query: `hackathonId` (required)
Returns: `200` and a list of entries, each with `note` and `user: { id, name, city, college, skills }`
Errors: `400`, `404`

---

## Matches

Matching score: each matching skill is worth 10 points, the same city adds 3, the same college adds 1. Results come best first.

### GET /api/matches/teams
Teams with open spots, ranked for the logged-in solo member.
Query: `hackathonId` (required)
Returns: `200` and a list of teams (with `leader`, `members`), each with `score` and `matchedSkills`
Errors: `400`, `404`, `409` if the person is already on a team

### GET /api/matches/solo
Solo members, ranked for a team. Team leader only.
Query: `teamId` (required)
Returns: `200` and a list of solo entries (with `note` and `user`), each with `score` and `matchedSkills`. People already on a team are left out.
Errors: `400`, `403` not the leader, `404`

---

## Requests (join and invite)

`type` is `JOIN` (a solo member asks to join a team) or `INVITE` (a team leader invites a solo member).
`status` is `PENDING`, `ACCEPTED` or `DECLINED`.
Who answers: the **team leader** answers a `JOIN`, and the **invited person** answers an `INVITE`.

### POST /api/requests
Sends: `type`, `teamId`, optional `message`. For `INVITE`, also `userId` (the solo person being invited).
Returns: `201` and the request with `team`, `user` and `sender`
Errors: `400` (bad input, deadline passed, the person is not listed as solo, inviting yourself), `403` a non-leader tried to invite, `404` team not found, `409` team full, someone is already on a team, or a pending request already exists

### GET /api/requests
Returns: `200` and `{ received, sent }`, newest first.
`received` holds requests waiting for this person to answer. `sent` holds requests this person started. Each item has `type`, `status`, `message`, `team: { id, name, hackathonId }`, `user: { id, name }` (the solo person) and `sender: { id, name }`.

### PATCH /api/requests/:id
Sends: `action` (`ACCEPT` or `DECLINE`)
Returns: `200` and the updated request. On accept, the person joins the team, the team's `spotsNeeded` drops by one, and they are removed from the solo list.
Errors: `400`, `403` not the person who should answer, `404`, `409` already answered, team full, or the person already joined another team

---

## Admin (ADMIN role only; everyone else gets `403`)

### GET /api/admin/hackathons/hidden
Returns: `200` and the hidden hackathons, each with `postedBy`, `reports` (`{ reason, createdAt }`) and `_count.reports`

### POST /api/admin/hackathons/:id/hide
Returns: `200` and `{ message }`. Hides any post.

### POST /api/admin/hackathons/:id/restore
Returns: `200` and `{ message }`. Unhides the post and clears its old reports.

### DELETE /api/admin/hackathons/:id
Returns: `200` and `{ message }`. Deletes the post permanently, along with its teams, members, solo entries, requests and reports.

Errors for all admin routes: `400` bad id, `403` not an admin, `404` not found

---

## Tips for the frontend

- Store the token after login (for example in `localStorage`) and send it with every request except signup and login.
- If any response is `401`, clear the token and show the login screen.
- A hidden hackathon returns `404`, so the screen should handle a post that disappears.
- Show a team member's contact details only when the `contact` field is present in the response.
