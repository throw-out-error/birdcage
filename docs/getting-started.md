# Getting Started

## Requirements
The first thing you'll need is node.js and a package manager such as npm, pnpm, or yarn (npm is the built in one).  In this case I'll be using pnpm. You'll also need git to clone the repository. 
## Getting Started
First clone the repository and cd into it. 

```bash
git clone https://github.com/throw-out-error/birdcage
cd birdcage
```

Next, install the dependencies with the package manager you've chosen.

```bash
pnpm install
```

Now, build and link the binary (you don't need to do this if you have installed birdcage from npm directly via npm i -g).

```bash
pnpm run build
sudo pnpm link
```

Upon first time setup, you will need to migrate the database:

```bash
birdcage up
```

Lastly, you can build and run birdcage with the following command:
sudo birdcage server
You will be prompted for your root password. This is required in order to listen on port 80 and 443. If you are using windows, remove the sudo part and rerun the command in a terminal that has been started in administrator mode.
That's it! You can now go to the admin panel. See the next page for more information on the admin panel.
