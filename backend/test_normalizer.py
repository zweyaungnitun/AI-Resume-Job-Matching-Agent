#!/usr/bin/env python3
"""Test script for the Job Title Normalizer improvements"""

from app.services.job_title_normalizer import JobTitleNormalizer

def test_job_title_normalization():
    """Test job title normalization with various inputs"""
    normalizer = JobTitleNormalizer()

    test_cases = [
        "AI Engineer",
        "Artificial Intelligence Engineer",
        "Senior AI Engineer",
        "Junior Machine Learning Engineer",
        "ML Engineer",
        "Data Scientist",
        "Senior Backend Engineer",
        "Lead Full Stack Developer",
        "DevOps Specialist",
        "QA Engineer",
        "Product Manager",
    ]

    print("=" * 100)
    print("JOB TITLE NORMALIZATION TEST")
    print("=" * 100)

    for title in test_cases:
        result = normalizer.normalize(title)
        print(f"\nOriginal:        {title}")
        print(f"Normalized:      {result['normalized_title']}")
        print(f"Level:           {result['level'] or 'N/A'}")
        print(f"Specialization:  {result['specialization'] or 'N/A'}")
        print(f"Core Role:       {result['core_role']}")
        print(f"Matching Keywords: {', '.join(result['matching_keywords'][:5])}")
        print("-" * 100)

def test_skill_extraction():
    """Test skill extraction from job titles"""
    normalizer = JobTitleNormalizer()

    test_jobs = [
        ("Senior AI Engineer", "Develop and deploy AI models using Python and TensorFlow. Work with LLMs and NLP."),
        ("ML Engineer", "Build machine learning pipelines using Spark and scikit-learn"),
        ("DevOps Engineer", "Manage Kubernetes clusters, Docker containers, and CI/CD pipelines"),
    ]

    print("\n" + "=" * 100)
    print("SKILL EXTRACTION TEST")
    print("=" * 100)

    for job_title, description in test_jobs:
        skills = normalizer.extract_core_skills(job_title, description)
        print(f"\nJob Title: {job_title}")
        print(f"Technical Skills: {', '.join(skills.get('technical_skills', []))}")
        print(f"Domain: {skills.get('domain', 'N/A')}")
        print("-" * 100)

def test_matching():
    """Test finding closest role matches"""
    normalizer = JobTitleNormalizer()

    target_roles = [
        "Senior AI Engineer",
        "Data Scientist",
        "Backend Engineer",
        "DevOps Engineer",
        "Product Manager",
    ]

    test_titles = [
        "Artificial Intelligence Engineer",
        "Machine Learning Specialist",
        "Backend Developer",
    ]

    print("\n" + "=" * 100)
    print("ROLE MATCHING TEST")
    print("=" * 100)

    for test_title in test_titles:
        match = normalizer.find_closest_match(test_title, target_roles)
        print(f"\n'{test_title}' -> best match: '{match}'")
    print("-" * 100)

if __name__ == "__main__":
    test_job_title_normalization()
    test_skill_extraction()
    test_matching()
    print("\n✓ All tests completed!")
