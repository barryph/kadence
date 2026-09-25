# Kadence

This is Kadence, personal habit tracker built around recurring activities.

You define what you want to do, how often you want to do it, and the Kadence
lines up your next activities. The days list is ready for you, when you are.
Ticking off items build up a log, and history build up into a timeline and
activity insights.

The project is also an experiment in Domain Driven Design + Clean Architecture
in a NestJS API.

## Features ✨

* Visualize exercises based on your cadence
* You don't choose exercises, exercises choose you
* I learn more DDD + Clean Architecture

## Real Features
* **Due today list** - activities due on your interval surface on the home
  screen.
* **Interval-based scheduling** - each activity has an interval, complete an activity and
  and it resets to day 0.
* **Weekly goals** - set a target per week for any activity, then track
  adherence with weekly progress charts and rings.
* **Timeline** - a scrollable history grid of what you did and when.
* **Categories** - colour-code activities and filter based on category.
  timeline by them.
* **Insights** - weekly charts of active days over the last 8 weeks, filterable
  by activity or category.

## Stack

| Part | Tech |
| --- | --- |
| `back-end/` | NestJS 11, PostgreSQL, Knex, Passport, DDD + Clean Architecture |
| `front-end/` | Expo SDK 54, React Native, expo-router, TanStack Query |
| Tooling | pnpm, Jest, Testcontainers, Maestro, GitHub Actions |

## Installation

Install dependencies

```bash
# Install dependencies in each package (pnpm is required; each package pins
# pnpm via its packageManager field):
#   cd back-end  && pnpm install
#   cd front-end && pnpm install
pnpm install
```

## Setup

This project uses knex to handle database migrations.

```bash
# Run this as the user with postgres permissions
createdb kadence;
# Run these inside the back-end/ dir
pnpm run db:up;
pnpm run db:seed;
```

## Usage

Run the server

More details in `back-end/README.md`
```bash
# Make sure your postgresql server is running
cd back-end;
pnpm run start:dev;
```

Run the client
```bash
cd front-end;
pnpm run start;   # expo start (there is no pnpm run dev)
```

## License

[MIT](https://choosealicense.com/licenses/mit/) 
