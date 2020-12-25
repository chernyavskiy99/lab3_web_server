const chai = require('chai');
const chaiHttp = require('chai-http');
require('mocha')
const should = chai.should();
const request = require('request');
const sinon = require('sinon');
require('sinon-mongo');
const server = require('../app')

chai.use(chaiHttp);

const apiKey = 'd136e52c1f0eee76445085fa375a3f40';
const baseURL = 'https://api.openweathermap.org/data/2.5';
const queryParameters = `appid=${apiKey}&units=metric&lang=ru`

describe('SERVER: GET /weather/city', () => {
    it('ok response from weather server', (done) => {
        const responseObject = {
            statusCode: 200,
        };

        const responseBody =
            {
                "coord": {"lon": 37.62, "lat": 55.75},
                "weather": [{"id": 804, "main": "Clouds", "description": "пасмурно", "icon": "04n"}],
                "base": "stations",
                "main": {
                    "temp": -8.33,
                    "feels_like": -14.92,
                    "temp_min": -9,
                    "temp_max": -8,
                    "pressure": 1018,
                    "humidity": 85
                },
                "visibility": 10000,
                "wind": {"speed": 5, "deg": 170},
                "clouds": {"all": 90},
                "dt": 1608757054,
                "sys": {"type": 1, "id": 9027, "country": "RU", "sunrise": 1608789533, "sunset": 1608814764},
                "timezone": 10800,
                "id": 524901,
                "name": "Москва",
                "cod": 200
            }
        ;

        let city = 'Moscow'

        let requestMock = sinon.mock(request);
        requestMock.expects("get")
            .once()
            .withArgs(`${baseURL}/weather?q=${city}&${queryParameters}`)
            .yields(null, responseObject, JSON.stringify(responseBody));

        mockCollection = sinon.mongo.collection();
        cities = []
        mockCollection.find
            .returns(sinon.mongo.documentArray1(null, cities));

        global.DB = sinon.mongo.db({
            cities: mockCollection
        });

        chai.request(server)
            .get(`/weather/city?q=${city}`)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.eql(responseBody);
                requestMock.verify();
                requestMock.restore();
                done();
            });
    })

    it('error response from weather server', (done) => {
        city = 'Moscow'

        requestMock = sinon.mock(request);
        requestMock.expects("get")
            .once()
            .withArgs(`${baseURL}/weather?q=${city}&${queryParameters}`)
            .yields(new Error(), null, null);

        chai.request(server)
            .get(`/weather/city?q=${city}`)
            .end((err, res) => {
                res.should.have.status(500);
                requestMock.verify();
                requestMock.restore();
                done();
            });
    })
})


describe('SERVER: GET /weather/coordinates', () => {
    it('ok response from weather server', (done) => {
        const responseObject = {
            statusCode: 200,
        };

        const responseBody = {
            "coord": {
                "lon": 37.62,
                "lat": 55.75
            },
            "weather": [
                {
                    "id": 800,
                    "main": "Clear",
                    "description": "clear sky",
                    "icon": "01d"
                }
            ]
        };

        lon = 37.62;
        lat = 55.75;

        requestMock = sinon.mock(request);
        requestMock.expects("get")
            .once()
            .withArgs(`${baseURL}/weather?lat=${lat}&lon=${lon}&${queryParameters}`)
            .yields(null, responseObject, JSON.stringify(responseBody));

        chai.request(server)
            .get(`/weather/coordinates?lat=${lat}&lon=${lon}`)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.eql(responseBody);
                requestMock.verify();
                requestMock.restore();
                done();
            });
    })

    it('error response from weather server', (done) => {
        lon = '37.62';
        lat = '55.75';

        requestMock = sinon.mock(request);
        requestMock.expects("get")
            .once()
            .withArgs(`${baseURL}/weather?lat=${lat}&lon=${lon}&${queryParameters}`)
            .yields(new Error(), null, null);

        chai.request(server)
            .get(`/weather/coordinates?lat=${lat}&lon=${lon}`)
            .end((err, res) => {
                res.should.have.status(500);
                requestMock.verify();
                requestMock.restore();
                done();
            });
    })
})

describe('SERVER: GET /favourites', () => {
    it('ok response from weather database', (done) => {
        mockCollection = sinon.mongo.collection();
        cities = [{id: '524901', _id: 'ewfefecewcwec2ef3e'}, {id: '543878', _id: 'ecfef23e3e23'}]

        mockCollection.find
            .returns(sinon.mongo.documentArray1(null, cities));

        global.DB = sinon.mongo.db({
            cities: mockCollection
        });

        let responseObject = {statusCode: 200}
        let responseBody = {"cnt":2,"list":[{"coord":{"lon":40.93,"lat":57.77},"sys":{"country":"RU","timezone":10800,"sunrise":1608789614,"sunset":1608813094},"weather":[{"id":804,"main":"Clouds","description":"пасмурно","icon":"04n"}],"main":{"temp":-4,"feels_like":-9.71,"temp_min":-4,"temp_max":-4,"pressure":1018,"humidity":73},"visibility":10000,"wind":{"speed":4,"deg":190},"clouds":{"all":90},"dt":1608761350,"id":543878,"name":"Kostroma"},{"coord":{"lon":37.62,"lat":55.75},"sys":{"country":"RU","timezone":10800,"sunrise":1608789533,"sunset":1608814764},"weather":[{"id":804,"main":"Clouds","description":"пасмурно","icon":"04n"}],"main":{"temp":-8.33,"feels_like":-14.22,"temp_min":-9,"temp_max":-8,"pressure":1019,"humidity":85},"visibility":10000,"wind":{"speed":4,"deg":180},"clouds":{"all":90},"dt":1608761286,"id":524901,"name":"Moscow"}]}

        let requestMock = sinon.mock(request);
        requestMock.expects("get")
            .once()
            .withArgs(`${baseURL}/group?id=524901,543878&${queryParameters}`)
            .yields(null, responseObject, JSON.stringify(responseBody));

        chai.request(server)
            .get('/favourites')
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.eql(responseBody)
                sinon.assert.calledOnce(mockCollection.find);
                done();
            });
    })

    it('error response from weather database', (done) => {
        mockCollection = sinon.mongo.collection();
        mockCollection.find
            .returns(sinon.mongo.documentArray1(new Error(), null));

        global.DB = sinon.mongo.db({
            cities: mockCollection
        });

        chai.request(server)
            .get('/favourites')
            .end((err, res) => {
                res.should.have.status(500);
                sinon.assert.calledOnce(mockCollection.find);
                done();
            });
    })
})

describe('SERVER: DELETE /favourites', () => {
    it('ok response from weather database', (done) => {
        mockCollection = sinon.mongo.collection();
        cities = [{_id: '5aa5aa5a5aa5aa5a5aa5aa5a', id: '123456'}, {_id: '63f63f9963f63f9963f63f99', id: '654321'}]
        mockCollection.find
            .returns(sinon.mongo.documentArray1(null, cities));
        mockCollection.deleteOne
            .yields(null, {_id: '5aa5aa5a5aa5aa5a5aa5aa5a', id: '123456'});

        global.DB = sinon.mongo.db({
            cities: mockCollection
        });

        chai.request(server)
            .delete('/favourites?id=654321')
            .set('content-type', 'application/x-www-form-urlencoded')
            .end((err, res) => {
                res.should.have.status(200);
                sinon.assert.calledOnce(mockCollection.find);
                sinon.assert.calledOnce(mockCollection.deleteOne);
                done();
            });
    })

    it('error response from weather database', (done) => {
        mockCollection = sinon.mongo.collection();
        cities = [{_id: '5aa5aa5a5aa5aa5a5aa5aa5a', id: '123456'}, {_id: '63f63f9963f63f9963f63f99', id: '654321'}]
        mockCollection.find
            .returns(sinon.mongo.documentArray1(null, cities));
        mockCollection.deleteOne
            .yields(new Error(), null);

        global.DB = sinon.mongo.db({
            cities: mockCollection
        });

        chai.request(server)
            .delete('/favourites?id=123456')
            .set('content-type', 'application/x-www-form-urlencoded')
            .end((err, res) => {
                res.should.have.status(500);
                sinon.assert.calledOnce(mockCollection.find);
                sinon.assert.calledOnce(mockCollection.deleteOne);
                done();
            });
    })
})

sinon.mongo.documentArray1 = (err, result) => {
    if (!result) result = [];
    if (result.constructor !== Array) result = [result];

    return {
        sort: sinon.stub().returnsThis(),
        toArray: function f() {
            var callback = arguments[arguments.length - 1];
            if (typeof callback !== "function") {
                throw new TypeError("Expected last argument to be a function");
            }
            callback.apply(null, [err, result]);
        }
    }
}