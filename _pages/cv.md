---
layout: academic
title: Curriculum Vitae
permalink: /cv/
redirect_from:
  - /resume
---
<p class="eyebrow">Fangfang Xu · 徐方芳</p>
<h1>Curriculum Vitae</h1>
<p class="page-lead">Education, research experience, and selected honors.</p>
<a class="button" href="{{ site.data.academic.cv | relative_url }}">Download full CV <span class="file-label">PDF</span> <span aria-hidden="true">↓</span></a>
<section class="section">
  <div class="section-heading"><h2>Research interests</h2></div>
  <p>Predictive and interventional computational biology, with a focus on modeling how cells and tissues respond to genetic and chemical perturbations. I am particularly interested in multimodal and spatial representations of biological states for perturbation-response prediction, virtual cell and tissue modeling, and target prioritization.</p>
</section>
<section class="section">
  <div class="section-heading"><h2>Education</h2></div>
  {% include academic-education.html courses=true %}
</section>
<section class="section">
  <div class="section-heading"><h2>Research experience & preprint</h2></div>
  <p class="item-date">Spaceland · {{ site.data.academic.publication.period }}</p>
  {% include academic-publication.html %}
  {% include academic-projects.html %}
</section>
<section class="section">
  <div class="section-heading"><h2>Selected honors</h2></div>
  {% include academic-honors.html %}
</section>
