const express = require('express');
const joinService = require('../service/join');
const loginService = require('../service/login');
const findService = require('../service/find');
const PostOffice = require('./../mail-config/mail-password');
const tokenBuilder = require('uuid/v4');

const uuid = require('uuid/v4');

let mapper = {};


const router = express.Router();

/**
 * 회원가입
 */
router.post('/join', async (req, res) => {
  const {realName, nickName, password, email} = req.body;
  const result = await joinService.insertUser({realName, nickName, password, email})
    .then(results => results)
    .catch(error => error);

  if (result) {
    res.sendStatus(200);
  } else {
    res.sendStatus(500);
  }
});

/**
 * 로그인
 */

router.get('/login', async (req, res) => {
  const {session} = req;
  if (mapper[session.key]) {
    res.json({
      data: mapper[session.key],
      loginStatus: true,
    });
  } else {
    res.json({
      data: {},
      loginStatus: false,
    });
  }
});

router.post('/login', async (req, res) => {
  const {nickName, password} = req.body;
  const result = await loginService.login({nickName, password})
    .then(results => results)
    .catch(err => err);

  if (result) {
    const key = uuid();
    req.session.key = key;
    mapper[key] = result;
  }

  res.json({
    data: result,
    loginStatus: !!result,
  });
});


router.post('/find-id', async (req, res) => {
  const {realName, email} = req.body;
  const result = await findService.findId({realName, email})
    .then(results => results)
    .catch(err => err);

  if (result.length !== 0) {
    res.json(result[0]);
  } else {
    res.json(false);
  }
});

router.post('/find-password', async (req, res) => {
  const {realName, nickName, email} = req.body;
  const result = await findService.findPassword({realName, nickName, email})
    .then(results => results)
    .catch(err => err);

  if (result.length !== 0) {
    res.json(result[0]);
  } else {
    res.json(false);
  }
});

router.put('/find-password', async (req, res) => {
  const email = req.body.email;
  const tmpPassword = tokenBuilder();

  const result = await findService.insertTmpPassword({ email, tmpPassword })
    .then(results => results)
    .catch(err => err);

  PostOffice.transporter.sendMail(
    PostOffice.mailOptionBuilder(email, tmpPassword), (err, info) => {
      if (err) {
        console.error(err);
        res.sendStatus(500);
      } else {
        console.log(`EMAIL SENT ${info.response}`);
        res.sendStatus(200);
      }
    });
});

module.exports = router;

