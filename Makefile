all: index.html

index.html : render.py templates/index.html content.yaml
	python render.py
