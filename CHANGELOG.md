# Changelog

## [3.0.0](https://github.com/erikbern55-boop/dtek-schedule/compare/v2.3.0...v3.0.0) (2026-11-10)


### ⚠ BREAKING CHANGES

* the PAT secret is no longer used. Remove it from the repository secrets and revoke the token.
* bot state moved from the artifacts/ folder in main to the artifacts branch. The branch is created on the first run, which sends a new message. Bot commits "chore: update artifacts" no longer land in main.
* when the schedule changes during the day, the bot sends a new message (with a notification) as a reply to the previous one instead of editing a single message per day.

### Features

* allow triggering the workflow from an external cron ([e21246a](https://github.com/erikbern55-boop/dtek-schedule/commit/e21246ac6d7723395bae468d691178c6822d9a20))
* extend silent night mode to 22:00-08:00 ([0cb1214](https://github.com/erikbern55-boop/dtek-schedule/commit/0cb1214098a553d61740d05af3c6e3769c1c81b2))
* isolate landscape dashboard to fullscreen button and fit two panels to viewport ([58c4995](https://github.com/erikbern55-boop/dtek-schedule/commit/58c4995223992b462806152b705a4a482e8e7b94))
* replace timestamps emoji and drop seconds ([7c82aa6](https://github.com/erikbern55-boop/dtek-schedule/commit/7c82aa6b5276d3a842235964440444f8ddab3145))
* reply with a new message when the schedule changes ([6700b11](https://github.com/erikbern55-boop/dtek-schedule/commit/6700b11ff5e36f397644026a961c03234ce27243))
* send DTEK schedules for today and tomorrow; use fresh mirror backup ([fa7ddb9](https://github.com/erikbern55-boop/dtek-schedule/commit/fa7ddb93e1553f7967e785361f47bae9ebc5c359))
* show added and canceled DTEK outages in Telegram ([7aa0fbf](https://github.com/erikbern55-boop/dtek-schedule/commit/7aa0fbfa5c5da07defdcda46ad5404b8f6632eca))
* show planned daily power and outage duration in Telegram ([3690092](https://github.com/erikbern55-boop/dtek-schedule/commit/36900923296c529873143fe51884fa18f5b925e8))
* store bot state in a separate artifacts branch ([e2ea131](https://github.com/erikbern55-boop/dtek-schedule/commit/e2ea1319dc9795eab562358165572c30be9c3008))
* support multiple addresses via TARGETS variable ([d130089](https://github.com/erikbern55-boop/dtek-schedule/commit/d130089f19856fae6f6b0a66606d17cd92e5d288))
* Світлопульс — новий макет з городником, поривами вітру й астроблоком ([42d4ee0](https://github.com/erikbern55-boop/dtek-schedule/commit/42d4ee0a908dccecbb5f26f87fc161492f4d7753))
* Світлопульс — спочатку погода сьогодні, потім прогноз завтра ([5c021e7](https://github.com/erikbern55-boop/dtek-schedule/commit/5c021e76a45931e69a0c45490702832b67176e88))
* Світлопульс — температура зараз і прогноз на завтра одночасно ([c4d1c66](https://github.com/erikbern55-boop/dtek-schedule/commit/c4d1c66ec1ce6984144b946b7a4fe53f86fb35e1))
* Світлопульс 2.0 — погода, сонце та календар городника ([03bc7a5](https://github.com/erikbern55-boop/dtek-schedule/commit/03bc7a55efc46ec8cac036f6585cc3dba88f26f6))
* Світлопульс 2.1 — відлік до планової події та аварійний статус ([fef31e1](https://github.com/erikbern55-boop/dtek-schedule/commit/fef31e1556ff98b732f0aca666ed14ff2d308e64))
* Світлопульс 2.1 — затверджений дизайн 2×2 ([819d9a2](https://github.com/erikbern55-boop/dtek-schedule/commit/819d9a2be853f2a788057630c8d2b72edbab421f))
* Світлопульс 2.1 — місячний календар і температура ґрунту ([6d7761f](https://github.com/erikbern55-boop/dtek-schedule/commit/6d7761fce6e444ba3d70c55353091d055b85f8f1))
* сповіщення Світлопульсу про планові вимкнення та відновлення ([6e16711](https://github.com/erikbern55-boop/dtek-schedule/commit/6e16711c281d1d10c2104ed5f2ec7a22814038f0))
* фірмові картки Світлопульс для Telegram ([7bf3c37](https://github.com/erikbern55-boop/dtek-schedule/commit/7bf3c373e1db529992f60fd2c30b5ec4c360d7b1))


### Bug Fixes

* balance fullscreen columns by content height and preserve whole sections ([f383833](https://github.com/erikbern55-boop/dtek-schedule/commit/f383833a8728d2bdd831c0a3b0413e56bdc959ed))
* close the browser before retrying ([31dc16c](https://github.com/erikbern55-boop/dtek-schedule/commit/31dc16c5d5a1927f959827e305c3dc1b71af3a0b))
* correct the missing bot token error message ([e0d2705](https://github.com/erikbern55-boop/dtek-schedule/commit/e0d27059ba6ca60bd1ac0bc847cda4751d823af4))
* exit with non-zero code on failure ([8842841](https://github.com/erikbern55-boop/dtek-schedule/commit/8842841e5fed6ef3300f9d15c1478baeb13110ad))
* force image refresh and log Telegram media-edit confirmation ([#21](https://github.com/erikbern55-boop/dtek-schedule/issues/21)) ([6b9905e](https://github.com/erikbern55-boop/dtek-schedule/commit/6b9905eb2a440f261ec05aaf09b6085c2df308fb))
* force Telegram photo refresh for approved sun and soil row ([#23](https://github.com/erikbern55-boop/dtek-schedule/issues/23)) ([2581f6e](https://github.com/erikbern55-boop/dtek-schedule/commit/2581f6ec3a4e99e00a891fe779a523522cf041de))
* ignore "message is not modified" error ([6cf6431](https://github.com/erikbern55-boop/dtek-schedule/commit/6cf6431470d958d69ef34807b5f0799487382a00))
* keep last message on transient send errors ([92efeab](https://github.com/erikbern55-boop/dtek-schedule/commit/92efeab30b2713607ab89acf2ec84c5bb210d8e9))
* limit shutdowns data retries ([5100b25](https://github.com/erikbern55-boop/dtek-schedule/commit/5100b25959433855cce2fa308365b08912903bfd))
* remove extra blank line and stray backslash from the message ([5323955](https://github.com/erikbern55-boop/dtek-schedule/commit/5323955487d06946fcf71da3388c0ec14f014a24))
* report the actual error when schedule generation fails ([f618bf7](https://github.com/erikbern55-boop/dtek-schedule/commit/f618bf734cb43e4151bc64c8bc1ac6ef747faae4))
* restart staggered native 5-minute GitHub schedule backup ([e9315f4](https://github.com/erikbern55-boop/dtek-schedule/commit/e9315f4187ab11a8c10804d19a169a726676318b))
* retry sending the same notification ([1fe5e38](https://github.com/erikbern55-boop/dtek-schedule/commit/1fe5e383f5fb5240133285c9147ddde4ead9a955))
* scale original card to fullscreen height without landscape slicing ([964eb15](https://github.com/erikbern55-boop/dtek-schedule/commit/964eb1563bc39c4620545206dc3442450914b156))
* show a clear error when the group is not found ([ef43656](https://github.com/erikbern55-boop/dtek-schedule/commit/ef43656e2b5ef027d91fa6297d32452f0d72b517))
* size landscape canvas to available viewport instead of intrinsic portrait dimensions ([90d2ce9](https://github.com/erikbern55-boop/dtek-schedule/commit/90d2ce9a2e97633a5d496924a3aa97f5c6e217da))
* skip the run when there is no schedule for today ([964beec](https://github.com/erikbern55-boop/dtek-schedule/commit/964beec90a6492f7f79a345543f85bc30185f977))
* stretch fullscreen card to fill viewport height and width ([3093643](https://github.com/erikbern55-boop/dtek-schedule/commit/3093643c0323c700517e4a32ca5705fc2139e7fd))
* use disable_notification for silent night mode ([2b59b0e](https://github.com/erikbern55-boop/dtek-schedule/commit/2b59b0e646e85d7b9ba178551bb6c301aff959a3))
* повністю оновлювати поради й астропрогноз щодня ([#13](https://github.com/erikbern55-boop/dtek-schedule/issues/13)) ([81eef5d](https://github.com/erikbern55-boop/dtek-schedule/commit/81eef5d3715e9b841d40f7356a2f084e936ec041))
* показувати Світлопульс 2.3 на картці ([#16](https://github.com/erikbern55-boop/dtek-schedule/issues/16)) ([baa7f91](https://github.com/erikbern55-boop/dtek-schedule/commit/baa7f916ccb93045cae745be30f24d0d9d9df3ec))
* Світлопульс перемальовує картку після зміни дизайну ([3230379](https://github.com/erikbern55-boop/dtek-schedule/commit/323037979659299f370511413ab159813b5a08ee))


### Documentation

* describe multiple addresses setup ([1e3f7aa](https://github.com/erikbern55-boop/dtek-schedule/commit/1e3f7aa5f111e71eff47366d638d0a4a394a51c7))
* link releases in README ([be35642](https://github.com/erikbern55-boop/dtek-schedule/commit/be356420a776a78cc2cb2083518e37afdd22b178))
* remove yarn and multiple groups sections from README ([3b2ede0](https://github.com/erikbern55-boop/dtek-schedule/commit/3b2ede03ac7042fcba1af9c1493ccc0636505fc4))
* switch README to informal address and polish wording ([95978ab](https://github.com/erikbern55-boop/dtek-schedule/commit/95978ab9a9f2c4855576db8ef26fd1ff08069b3b))


### Continuous Integration

* add release-please ([5c287b0](https://github.com/erikbern55-boop/dtek-schedule/commit/5c287b08d34631b181904efc68a9a82d357344c4))
* cache npm and Playwright browsers ([5907f9f](https://github.com/erikbern55-boop/dtek-schedule/commit/5907f9febd57aa76f4a25bdacbc2886c48f00ae9))
* keep scheduled workflow enabled via GitHub API ([3396564](https://github.com/erikbern55-boop/dtek-schedule/commit/339656421aacd41d98c1feb29fccdbfbe67ae7fa))
* replace PAT with GITHUB_TOKEN ([34a5355](https://github.com/erikbern55-boop/dtek-schedule/commit/34a53551461f54bdcf828bf897d0626674311744))
* use npm ci ([1ab5a4c](https://github.com/erikbern55-boop/dtek-schedule/commit/1ab5a4caf16bea17ed230b4311b5304be80b9bfa))

## [2.3.0](https://github.com/mr-devboy/dtek-schedule/compare/v2.2.1...v2.3.0) (2026-10-25)


### Features

* support multiple addresses via TARGETS variable ([d130089](https://github.com/mr-devboy/dtek-schedule/commit/d130089f19856fae6f6b0a66606d17cd92e5d288))


### Documentation

* describe multiple addresses setup ([1e3f7aa](https://github.com/mr-devboy/dtek-schedule/commit/1e3f7aa5f111e71eff47366d638d0a4a394a51c7))


### Continuous Integration

* cache npm and Playwright browsers ([5907f9f](https://github.com/mr-devboy/dtek-schedule/commit/5907f9febd57aa76f4a25bdacbc2886c48f00ae9))

## [2.2.1](https://github.com/mr-devboy/dtek-schedule/compare/v2.2.0...v2.2.1) (2026-10-19)


### Bug Fixes

* keep last message on transient send errors ([92efeab](https://github.com/mr-devboy/dtek-schedule/commit/92efeab30b2713607ab89acf2ec84c5bb210d8e9))

## [2.2.0](https://github.com/mr-devboy/dtek-schedule/compare/v2.1.0...v2.2.0) (2026-10-06)


### Features

* allow triggering the workflow from an external cron ([e21246a](https://github.com/mr-devboy/dtek-schedule/commit/e21246ac6d7723395bae468d691178c6822d9a20))

## [2.1.0](https://github.com/mr-devboy/dtek-schedule/compare/v2.0.0...v2.1.0) (2026-10-05)


### Features

* extend silent night mode to 22:00-08:00 ([0cb1214](https://github.com/mr-devboy/dtek-schedule/commit/0cb1214098a553d61740d05af3c6e3769c1c81b2))

## [2.0.0](https://github.com/mr-devboy/dtek-schedule/compare/v1.1.1...v2.0.0) (2026-10-05)


### ⚠ BREAKING CHANGES

* the PAT secret is no longer used. Remove it from the repository secrets and revoke the token.
* bot state moved from the artifacts/ folder in main to the artifacts branch. The branch is created on the first run, which sends a new message. Bot commits "chore: update artifacts" no longer land in main.
* when the schedule changes during the day, the bot sends a new message (with a notification) as a reply to the previous one instead of editing a single message per day.

### Features

* replace timestamps emoji and drop seconds ([7c82aa6](https://github.com/mr-devboy/dtek-schedule/commit/7c82aa6b5276d3a842235964440444f8ddab3145))
* reply with a new message when the schedule changes ([6700b11](https://github.com/mr-devboy/dtek-schedule/commit/6700b11ff5e36f397644026a961c03234ce27243))
* store bot state in a separate artifacts branch ([e2ea131](https://github.com/mr-devboy/dtek-schedule/commit/e2ea1319dc9795eab562358165572c30be9c3008))


### Bug Fixes

* close the browser before retrying ([31dc16c](https://github.com/mr-devboy/dtek-schedule/commit/31dc16c5d5a1927f959827e305c3dc1b71af3a0b))
* correct the missing bot token error message ([e0d2705](https://github.com/mr-devboy/dtek-schedule/commit/e0d27059ba6ca60bd1ac0bc847cda4751d823af4))
* exit with non-zero code on failure ([8842841](https://github.com/mr-devboy/dtek-schedule/commit/8842841e5fed6ef3300f9d15c1478baeb13110ad))
* ignore "message is not modified" error ([6cf6431](https://github.com/mr-devboy/dtek-schedule/commit/6cf6431470d958d69ef34807b5f0799487382a00))
* limit shutdowns data retries ([5100b25](https://github.com/mr-devboy/dtek-schedule/commit/5100b25959433855cce2fa308365b08912903bfd))
* remove extra blank line and stray backslash from the message ([5323955](https://github.com/mr-devboy/dtek-schedule/commit/5323955487d06946fcf71da3388c0ec14f014a24))
* report the actual error when schedule generation fails ([f618bf7](https://github.com/mr-devboy/dtek-schedule/commit/f618bf734cb43e4151bc64c8bc1ac6ef747faae4))
* retry sending the same notification ([1fe5e38](https://github.com/mr-devboy/dtek-schedule/commit/1fe5e383f5fb5240133285c9147ddde4ead9a955))
* show a clear error when the group is not found ([ef43656](https://github.com/mr-devboy/dtek-schedule/commit/ef43656e2b5ef027d91fa6297d32452f0d72b517))
* skip the run when there is no schedule for today ([964beec](https://github.com/mr-devboy/dtek-schedule/commit/964beec90a6492f7f79a345543f85bc30185f977))
* use disable_notification for silent night mode ([2b59b0e](https://github.com/mr-devboy/dtek-schedule/commit/2b59b0e646e85d7b9ba178551bb6c301aff959a3))


### Documentation

* link releases in README ([be35642](https://github.com/mr-devboy/dtek-schedule/commit/be356420a776a78cc2cb2083518e37afdd22b178))
* remove yarn and multiple groups sections from README ([3b2ede0](https://github.com/mr-devboy/dtek-schedule/commit/3b2ede03ac7042fcba1af9c1493ccc0636505fc4))
* switch README to informal address and polish wording ([95978ab](https://github.com/mr-devboy/dtek-schedule/commit/95978ab9a9f2c4855576db8ef26fd1ff08069b3b))


### Continuous Integration

* add release-please ([5c287b0](https://github.com/mr-devboy/dtek-schedule/commit/5c287b08d34631b181904efc68a9a82d357344c4))
* keep scheduled workflow enabled via GitHub API ([3396564](https://github.com/mr-devboy/dtek-schedule/commit/339656421aacd41d98c1feb29fccdbfbe67ae7fa))
* replace PAT with GITHUB_TOKEN ([34a5355](https://github.com/mr-devboy/dtek-schedule/commit/34a53551461f54bdcf828bf897d0626674311744))
* use npm ci ([1ab5a4c](https://github.com/mr-devboy/dtek-schedule/commit/1ab5a4caf16bea17ed230b4311b5304be80b9bfa))
