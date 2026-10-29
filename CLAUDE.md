# careerhub Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-04-03

## Active Technologies

- TypeScript 5.x — strict mode required + NestJS 10/11, Prisma 5, `@nestjs/bull`, `@sendgrid/mail`, (master)

## Project Structure

```text
src/
tests/
```

## Commands

npm test; npm run lint

## Code Style

TypeScript 5.x — strict mode required: Follow standard conventions

## Recent Changes

- master: Added TypeScript 5.x — strict mode required + NestJS 10/11, Prisma 5, `@nestjs/bull`, `@sendgrid/mail`,

<!-- MANUAL ADDITIONS START -->

## Git Identity — Always Use

Before every commit, ensure:

```
git config user.name "AhmedSalemKing"
git config user.email "ahmedsalem1forever@gmail.com"
```

## Commit Rules — Strictly Enforced

- NEVER add `Co-Authored-By` lines to any commit message
- NEVER add `Claude-Session` lines to any commit message
- NEVER add any attribution lines at all
- NEVER use emojis in commit messages
- Every commit author and committer must be `AhmedSalemKing <ahmedsalem1forever@gmail.com>`

## Push Workflow

After every commit, push to both the feature branch AND master using the PAT:

```bash
git remote set-url origin https://AhmedSalemKing:<PAT>@github.com/AhmedSalemKing/careerhub.git
git push --force-with-lease origin HEAD:master
git push -u origin <feature-branch>
git remote set-url origin https://github.com/AhmedSalemKing/careerhub.git
```

If the commit already has attribution lines (Co-Authored-By / Claude-Session), amend it first:

```bash
git log -1 --pretty=%B > /tmp/orig_msg.txt
grep -v "Co-Authored-By:" /tmp/orig_msg.txt | grep -v "Claude-Session:" > /tmp/clean_msg.txt
sed -i -e 's/[[:space:]]*$//' /tmp/clean_msg.txt
git commit --amend --reset-author -F /tmp/clean_msg.txt
```

Then push as above. The PAT is provided by the user at push time.

<!-- MANUAL ADDITIONS END -->
