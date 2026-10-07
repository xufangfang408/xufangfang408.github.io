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
  <div class="intro-copy">
  <p class="eyebrow">Computational biology · Spatial omics · AI</p>
  <h1 id="about-title">{{ site.data.academic.name }} <span lang="zh-Hans">{{ site.data.academic.name_zh }}</span></h1>
  <p class="intro-lead"><em>Work on things that matter.</em></p>
  <p>I am a master's student in <strong>Computer Science and Technology at Xiamen University</strong>, specializing in Health Big Data and Intelligent Medicine. I am fortunate to be jointly advised by <a href="https://scholar.google.com/citations?user=jyQyHPoAAAAJ&amp;hl=en" target="_blank" rel="noopener noreferrer"><strong>Chaoyong Yang,</strong></a> <a href="https://scholar.google.com/citations?user=3wJ4fPkAAAAJ&amp;hl=en" target="_blank" rel="noopener noreferrer"><strong>Liansheng Wang</strong></a> and <a href="https://scholar.google.com/citations?user=NV3pnwsAAAAJ&amp;hl=en" target="_blank" rel="noopener noreferrer"><strong>Jia Song</strong></a>.</p>
  <p>My research interests center on <strong>multimodal modeling of biological systems</strong> and <strong>perturbation-response prediction</strong>. I am particularly interested in developing computational models that learn biological states from multimodal measurements and predict how cells and tissues respond to genetic and chemical perturbations.</p>
  {% include academic-links.html %}
  </div>
  <figure class="intro-portrait">
    <img class="portrait" src="{{ site.data.academic.portrait | relative_url }}" alt="Portrait of {{ site.data.academic.name | escape }}" width="400" height="400" fetchpriority="high">
    <figcaption>{{ site.data.academic.role }}<br>{{ site.data.academic.location }}</figcaption>
  </figure>
</section>

<section id="research" class="section" aria-labelledby="research-title">
  <div class="section-heading"><h2 id="research-title">Research interests</h2></div>
  <p class="section-intro">I am interested in predictive and interventional computational biology, with three connected directions:</p>
  <div class="interests">
    {% for interest in site.data.academic.interests %}
    <article><h3>{{ interest.title }}</h3><p>{{ interest.description }}</p></article>
    {% endfor %}
  </div>
</section>

<section id="publications" class="section" aria-labelledby="publication-title">
  <div class="section-heading"><h2 id="publication-title">Selected publication</h2></div>
  {% include academic-publication.html %}
</section>

<section id="projects" class="section" aria-labelledby="projects-title">
  <div class="section-heading"><h2 id="projects-title">Ongoing research</h2></div>
  {% include academic-projects.html %}
</section>

<section id="education" class="section" aria-labelledby="education-title">
  <div class="section-heading"><h2 id="education-title">Education</h2></div>
  {% include academic-education.html %}
</section>

<section id="honors" class="section" aria-labelledby="honors-title">
  <div class="section-heading"><h2 id="honors-title">Selected honors</h2></div>
  {% include academic-honors.html %}
</section>

<section id="contact" class="contact-section" aria-labelledby="contact-title">
  <p class="eyebrow">Contact</p>
  <h2 id="contact-title">Let's connect.</h2>
  <p>For research conversations and academic inquiries, please reach out by email.</p>
  <a class="contact-email" href="mailto:{{ site.data.academic.email }}">{{ site.data.academic.email }} <span aria-hidden="true">↗</span></a>
</section>
