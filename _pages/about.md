---
layout: academic
permalink: /
title: "Fangfang Xu | Computational Biology & Spatial Omics"
description: "Fangfang Xu is a master's student at Xiamen University working on spatial omics, histopathology, and multimodal computational biology."
redirect_from:
  - /about/
  - /about.html
---

<section class="intro" aria-labelledby="about-title">
  <h1 id="about-title">About</h1>
  <p>I am a master's student in <strong>Computer Science and Technology at Xiamen University</strong>, specializing in Health Big Data and Intelligent Medicine. My advisors are <a href="https://scholar.google.com/citations?user=jyQyHPoAAAAJ&amp;hl=en" target="_blank" rel="noopener noreferrer">Chaoyong Yang</a>, <a href="https://scholar.google.com/citations?user=3wJ4fPkAAAAJ&amp;hl=en" target="_blank" rel="noopener noreferrer">Liansheng Wang</a>, and <a href="https://scholar.google.com/citations?user=NV3pnwsAAAAJ&amp;hl=en" target="_blank" rel="noopener noreferrer">Jia Song</a>.</p>
  <p>I develop computational models that integrate spatial omics and histopathology to characterize biological states. I am interested in using these models to predict how cells and tissues respond to genetic and chemical perturbations.</p>
</section>

<section id="research" class="section" aria-labelledby="research-title">
  <div class="section-heading"><h2 id="research-title">Research interests</h2></div>
  <ul class="interests">
    {% for interest in site.data.academic.interests %}
    <li><strong>{{ interest.title | escape }}</strong><br>{{ interest.description | escape }}</li>
    {% endfor %}
  </ul>
</section>

<section id="publications" class="section" aria-labelledby="publication-title">
  <div class="section-heading">
    <h2 id="publication-title">Selected publication</h2>
    <a href="{{ '/publications/' | relative_url }}">All publications</a>
  </div>
  {% include academic-publication.html compact=true %}
</section>

<section id="projects" class="section" aria-labelledby="projects-title">
  <div class="section-heading"><h2 id="projects-title">Ongoing research</h2></div>
  {% include academic-projects.html %}
</section>

{% assign latest_talk = site.data.talks | sort: 'year' | last %}
{% if latest_talk %}
<section id="talks" class="section" aria-labelledby="recent-talk-title">
  <div class="section-heading">
    <h2 id="recent-talk-title">Recent talk</h2>
    <a href="{{ '/talks/' | relative_url }}">All talks</a>
  </div>
  <article class="talk">
    <h3><a href="{{ '/talks/' | relative_url }}#{{ latest_talk.id | escape }}">{{ latest_talk.title | escape }}</a></h3>
    <p>{{ latest_talk.event | escape }}</p>
    <p class="muted">{{ latest_talk.location | escape }}</p>
  </article>
</section>
{% endif %}

<section id="education" class="section" aria-labelledby="education-title">
  <div class="section-heading"><h2 id="education-title">Education</h2></div>
  {% include academic-education.html %}
</section>

<section id="honors" class="section" aria-labelledby="honors-title">
  <div class="section-heading"><h2 id="honors-title">Selected honors</h2></div>
  {% include academic-honors.html %}
</section>

<section id="contact" class="section" aria-labelledby="contact-title">
  <div class="section-heading"><h2 id="contact-title">Contact</h2></div>
  <p>Email <a class="contact-email" href="mailto:{{ site.data.academic.email }}">{{ site.data.academic.email }}</a></p>
</section>
