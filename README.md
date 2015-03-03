Docker-mon
----------

Console Docker monitoring based on [blessed-contrib](https://github.com/yaronn/blessed-contrib).

![sample](https://raw.githubusercontent.com/icecrime/docker-mon/master/screenshots/screen.png)

Please note:

- It is **work in progress**
- It relies on the yet to be released [`docker stats` feature](https://github.com/docker/docker/pull/9984): you will need either a [master build](https://master.dockerproject.com/) or the upcoming v1.5.0 (see the [announcement for v1.5.0-rc1](https://groups.google.com/d/msg/docker-dev/nzKREJKqxe4/nsc9tkTLkccJ))
- [I don't know JS](http://i.imgur.com/xVyoSl.jpg), so contributions are welcome (see below for ideas)

# Usage

An automated build is set up for the project, so you can run it with:

    $ docker run -ti -v /var/run/docker.sock:/var/run/docker.sock icecrime/docker-mon

If you feel like building it yourself:

    $ docker build -t docker-mon .
    $ docker run -ti -v /var/run/docker.sock:/var/run/docker.sock docker-mon

- Pick a container from the upper left list and press `enter` to retrieve its information
- The `j` and `k` keys are currently used to scroll the `inspect` output in the upper right box

# Installing

You can also install docker-mon directly on your system (not in a container) using npm

    npm install -g docker-mon

# Contributing

Feel like contributing? Great! Here's a few things that I think would be interesting:

- Properly close stream when switching monitored container
- Ability to refresh the container list
- Make an awesome colortheme
- ...
