const express = require('express');
const router = new express.Router();
const sharp = require('sharp');
const multer = require('multer');

const auth = require('../middleware/auth');
const { sendWelcomeEmail, sendGoodbyeEmail } = require('../emails/account');

const User = require('../models/user');


router.post('/users', async (req, res) => {
    const user = new User(req.body);
    try {
        await user.save();
        sendWelcomeEmail(user.email, user.name);
        const token = await user.generateAuthToken();

        res.status(201).send({ user, token });
    } catch (error) {
        res.status(400).send(error);
    }
});

router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthToken();

        res.send({ user, token });
    } catch (error) {
        res.status(400).send(error);
    }
})

router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter(token => token.token !== req.token)
        await req.user.save();

        res.send();
    } catch (error) {
        res.status(500).send(error);
    }
});

router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();
        res.send();
    } catch (error) {
        res.status(500).send(error);
    }
})

router.get('/users', auth, async (req, res) => {
    try {
        const users = await User.find({});
        res.send(users);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.get('/users/me', auth, async (req, res) => {
    res.send(req.user);
});

router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'email', 'password', 'age'];
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid Updates!' });
    }

    try {
        const user = req.user;

        updates.forEach(update => user[update] = req.body[update])

        await user.save();

        res.send(user);
    } catch (error) {
        res.status(400).send(error);
    }
});

router.delete('/users/me', auth, async (req, res) => {
    try {
        await req.user.remove();
        sendGoodbyeEmail(req.user.email, req.user.name)
        res.send(req.user);

    } catch (error) {
        res.status(500).send(error);
    }
});

const avatar = multer({
    limits: {
        fileSize: 1000000,
    },
    fileFilter(req, file, cb) {
        console.log('in file filter');
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('File must be an image'));
        }

        cb(undefined, true);
    }
});

router.post('/user/me/avatar', auth, avatar.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer();
    req.user.avatar = buffer;
    await req.user.save();

    res.send();
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message });
})

router.delete('/user/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined;
    await req.user.save();
    res.send('image deleted');
})

router.get('/user/:id/avatar', async (req, res) => {
    try {

        const user = await User.findById(req.params.id);

        if (!user || !user.avatar) {
            throw new Error("Cannot find an image");
        }

        res.set('Content-Type', 'image/png');
        res.send(user.avatar);

    } catch (error) {
        console.log(error);
        res.status(404).send('uh oh')
    }
})

module.exports = router;