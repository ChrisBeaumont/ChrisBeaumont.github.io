from jinja2 import Template
import yaml

with open('templates/index.html') as infile:
    template = Template(infile.read())

with open('content.yaml') as infile:
    data = yaml.load(infile)

with open('index.html', 'w') as outfile:
    outfile.write(template.render(**data))
