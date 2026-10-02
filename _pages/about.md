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
  <p class="eyebrow">Computational biology · Spatial omics · AI</p>
  <h1 id="about-title">Fangfang Xu <span lang="zh-Hans">徐方芳</span></h1>
  <p class="intro-lead">From spatial biological maps<br class="desktop-break"> to predictive models of cells and tissues.</p>
  <p>I am a master's student in <strong>Computer Science and Technology at Xiamen University</strong>, specializing in Health Big Data and Intelligent Medicine. I am jointly supervised by Chaoyong Yang, Liansheng Wang, and Jia Song.</p>
  <p>My research brings together <strong>spatial omics, histopathology, and multimodal learning</strong>. Building on my work in 3D molecular reconstruction, I aim to develop models that connect biological measurements with experimentally testable predictions of how cells and tissues respond to genetic and chemical interventions.</p>
  <div class="intro-actions"><a class="button" href="{{ site.data.academic.cv | relative_url }}">Download CV <span aria-hidden="true">↓</span></a><a class="text-link" href="mailto:{{ site.data.academic.email }}">Get in touch <span aria-hidden="true">↗</span></a></div>
</section>

<section id="research" class="section" aria-labelledby="research-title">
  <div class="section-heading"><h2 id="research-title">Research interests</h2><span class="section-index" aria-hidden="true">01</span></div>
  <p class="section-intro">I am interested in predictive and interventional computational biology, with three connected directions:</p>
  <div class="interests">
    {% for interest in site.data.academic.interests %}
    <article><span class="interest-number" aria-hidden="true">0{{ forloop.index }}</span><h3>{{ interest.title }}</h3><p>{{ interest.description }}</p></article>
    {% endfor %}
  </div>
</section>

<section id="publications" class="section" aria-labelledby="publication-title">
  <div class="section-heading"><h2 id="publication-title">Selected publication</h2><span class="section-index" aria-hidden="true">02</span></div>
  {% include academic-publication.html %}
</section>

<section id="projects" class="section" aria-labelledby="projects-title">
  <div class="section-heading"><h2 id="projects-title">Ongoing research</h2><span class="section-index" aria-hidden="true">03</span></div>
  {% include academic-projects.html %}
</section>

<section id="education" class="section" aria-labelledby="education-title">
  <div class="section-heading"><h2 id="education-title">Education</h2><span class="section-index" aria-hidden="true">04</span></div>
  {% include academic-education.html %}
</section>

<section id="honors" class="section" aria-labelledby="honors-title">
  <div class="section-heading"><h2 id="honors-title">Selected honors</h2><span class="section-index" aria-hidden="true">05</span></div>
  {% include academic-honors.html %}
</section>

<section id="contact" class="contact-section" aria-labelledby="contact-title">
  <p class="eyebrow">Contact</p>
  <h2 id="contact-title">Let's connect.</h2>
  <p>For research conversations and academic inquiries, please reach out by email.</p>
  <a class="contact-email" href="mailto:{{ site.data.academic.email }}">{{ site.data.academic.email }} <span aria-hidden="true">↗</span></a>
</section>
