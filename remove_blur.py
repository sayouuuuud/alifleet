import os

f = 'd:/alifleet/components/global-reach.tsx'
with open(f, 'r', encoding='utf-8') as file:
    content = file.read()

new_content = content.replace('backdrop-blur-md', '')

with open(f, 'w', encoding='utf-8') as file:
    file.write(new_content)
