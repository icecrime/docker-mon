Docker-mon
----------

Console Docker monitoring based on [blessed-contrib](https://github.com/yaronn/blessed-contrib).

![sample](https://raw.githubusercontent.com/icecrime/docker-mon/master/screenshots/screen.png)

Please note:

- It is **work in progress**
- Needs docker >= 1.5.0 as it relies on [`docker stats` feature](https://github.com/docker/docker/pull/9984)
- [I don't know JS](http://i.imgur.com/xVyoSl.jpg), so contributions are welcome (see below for ideas)

# Usage

An automated build is set up for the project, so you can run it with:

    $ docker run -ti -v /var/run/docker.sock:/var/run/docker.sock icecrime/docker-mon

If you feel like building it yourself:

    $ docker build -t docker-mon .
    $ docker run -ti -v /var/run/docker.sock:/var/run/docker.sock docker-mon

- Pick a container from the upper left list and press `enter` to retrieve its information
- The `j` and `k` keys are currently used to scroll the `inspect` output in the upper right box

# Contributing

Feel like contributing? Great! Here's a few things that I think would be interesting:

- Properly close stream when switching monitored container
- Ability to refresh the container list
- Make an awesome colortheme
- ...
