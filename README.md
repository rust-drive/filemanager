# filemanager

Filemanager for Webdav, built with HTML and JS. Perfect for static deployment.

## Concept

- Compatible with most WebDAV servers
- Standalaone and Cloud-Integrated Deployment
- Custom and Fixed Configuration

## Development setup

First off all you need to install Docker.
<https://docs.docker.com/get-started/get-docker/>

Start the Environment with this command:

```bash
docker compose -f development-compose.yaml up
```

Stop it with this command:

```bash
docker compose -f development-compose.yaml down
```

- Webdav Testserver <http://localhost:8080>
	- User: john
	- Pass: doe
	- Path: /dav
- Static Server <http://localhost>
	- Path: /src