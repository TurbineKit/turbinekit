# create-turbinekit

Creates a [TurbineKit](https://github.com/turbinekit/turbinekit) project: a
lean, AI-first Turborepo boilerplate for Next.js products, built only on free
and open tools.

```sh
pnpm create turbinekit my-app
```

The CLI asks for your product's name, languages and modules, then writes a
project with only what you picked: no dead code, no unused dependencies.

Every question has a flag, for agents and CI. `--help` lists them:

```sh
pnpm create turbinekit my-app --yes --modules orgs,admin --locales en,es,pt-BR
```

Needs Node.js 24 and pnpm. The
[TurbineKit README](https://github.com/turbinekit/turbinekit#readme) lists
what a project gets and the modules you can pick.

## License

MIT
