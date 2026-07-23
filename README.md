# Kadence

Hello 👋, this is me experimenting with Domain Driven Design + Clean Architecture in a Nest.js project.

## Features ✨
* Visualize exercises based on your timeline
* You don't choose exercises, exercises choose you
* I learn more DDD + Clean Architecture

## Installation

Install dependencies

```bash
npm install;
```

## Setup

This project uses knex to handle database migrations.

```bash
# Run this as the user with postgres permissions
createdb kadence;
# Run these inside the back-end/ dir
npm run db:up;
npm run db:seed;
```

## Usage

Run the server

More details in `back-end/README.md`
```bash
# Make sure your postgresql server is running
cd back-end;
npm run start:dev;
```

Run the client
```bash
cd front-end;
npm run dev;
```

## License

[MIT](https://choosealicense.com/licenses/mit/) 
