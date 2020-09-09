const request = require("supertest");

const jwt = require('jsonwebtoken');
const mongoose = require("mongoose");

const User = require("../src/models/user");
const app = require("../src/app");
const { setupDatabase, kittenberry, kittenberryId } = require("./fixtures/db");

beforeEach(setupDatabase)

test('Should signup a new user', async () => {
    const response = await request(app)
        .post('/users')
        .send({
            name: 'Bombadil',
            email: 'fluffy2@whiskers.com',
            password: 'meowmeowmeow',
        })
        .expect(201);

    // Assert that database was changed correctly
    const user = await User.findById(response.body.user._id);
    expect(user).not.toBeNull();

    //Assertions about the response
    expect(response.body).toMatchObject({
        user: {
            name: 'Bombadil',
            email: 'fluffy2@whiskers.com'
        }
    })

    expect(user.password).not.toBe('meowmeowmeow')
})

test('Should login existing user', async () => {
    const response = await request(app).post('/users/login').send({
        email: kittenberry.email,
        password: kittenberry.password
    }).expect(200);

    const user = await User.findById(response.body.user._id);
    expect(user.tokens[1].token).toBe(response.body.token);

})

test('Should not login nonexistant user', async () => {
    await request(app).post('/user/login').send({
        email: kittenberry.email,
        password: 'notarealpassword',
    }).expect(404);
})

test('Should get profile for logged in user', async () => {
    await request(app)
        .get('/users/me')
        .set('Authorization', `Bearer ${kittenberry.tokens[0].token}`)
        .send()
        .expect(200);
})

test('Should not get profile for unauthenticated user', async () => {
    await request(app)
        .get('/users/me')
        .send()
        .expect(401);
})

test('Should delete account for user', async () => {
    const response = await request(app)
        .delete('/users/me')
        .set('Authorization', `Bearer ${kittenberry.tokens[0].token}`)
        .send()
        .expect(200);

    const user = await User.findById(response.body._id);
    expect(user).toBeNull();
})

test('Should not delete account for unauthenticated user', async () => {
    await request(app)
        .delete('/users/me')
        .send()
        .expect(401);
})

test('Should upload avatar image', async () => {
    await request(app)
        .post('/user/me/avatar')
        .set('Authorization', `Bearer ${kittenberry.tokens[0].token}`)
        .attach('avatar', 'tests/fixtures/profile-pic.jpg')
        .expect(200);

    const user = await User.findById(kittenberryId);
    expect(user.avatar).toEqual(expect.any(Buffer))
})

test('Should update valid user fields', async () => {
    await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${kittenberry.tokens[0].token}`)
        .send({
            name: "Goldberry"
        }).expect(200);

    const user = await User.findById(kittenberryId);
    expect(user.name).toBe("Goldberry");
})

test('Should not update invalid user fields', async () => {
    await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${kittenberry.tokens[0].token}`)
        .send({
            location: 'The couch'
        }).expect(400)
})