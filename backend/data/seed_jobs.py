"""
Seed script to populate Pinecone with sample job descriptions.
Run this once to index jobs for the RAG system.

Usage:
    python data/seed_jobs.py
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.rag_service import RAGService


SAMPLE_JOBS = [
    {
        "job_title": "Senior Python Developer",
        "company": "Tech Corp",
        "description": """
        We are looking for a Senior Python Developer with 5+ years of experience.
        You will work on backend systems, APIs, and data processing pipelines.

        Required Skills:
        - Python 3.8+
        - FastAPI or Flask
        - PostgreSQL
        - Docker and Kubernetes
        - AWS or GCP
        - Git and CI/CD

        Nice to Have:
        - Machine Learning experience
        - Microservices architecture
        - GraphQL
        - Redis
        """,
        "requirements": [
            "Python 3.8+",
            "FastAPI or Flask",
            "PostgreSQL",
            "Docker",
            "AWS/GCP"
        ]
    },
    {
        "job_title": "Frontend React Engineer",
        "company": "Web Solutions Inc",
        "description": """
        Join our frontend team and build beautiful, responsive user interfaces.
        You'll work with React, TypeScript, and modern web technologies.

        Required Skills:
        - React 16+
        - TypeScript
        - HTML5 and CSS3
        - Webpack or Vite
        - REST APIs
        - Git

        Nice to Have:
        - Next.js
        - GraphQL client libraries
        - Jest and React Testing Library
        - Mobile-first design
        - CSS-in-JS frameworks
        """,
        "requirements": [
            "React",
            "TypeScript",
            "HTML5",
            "CSS3",
            "JavaScript"
        ]
    },
    {
        "job_title": "Data Engineer",
        "company": "Data Analytics Co",
        "description": """
        We're seeking a Data Engineer to build and maintain data pipelines.
        Work with big data technologies and create scalable data solutions.

        Required Skills:
        - Python or Java
        - SQL
        - Spark or Hadoop
        - Data warehousing
        - ETL processes
        - Git

        Nice to Have:
        - Cloud platforms (AWS, GCP, Azure)
        - Airflow or dbt
        - Kafka
        - Machine Learning basics
        - Tableau or Looker
        """,
        "requirements": [
            "Python or Java",
            "SQL",
            "Spark",
            "ETL",
            "Data Warehousing"
        ]
    },
    {
        "job_title": "DevOps Engineer",
        "company": "Cloud Systems Ltd",
        "description": """
        Build and maintain cloud infrastructure and deployment pipelines.
        Work with containerization, orchestration, and monitoring systems.

        Required Skills:
        - Docker and Kubernetes
        - Linux
        - CI/CD (Jenkins, GitLab CI, GitHub Actions)
        - Infrastructure as Code (Terraform, CloudFormation)
        - AWS or Azure
        - Python or Bash scripting

        Nice to Have:
        - Prometheus and Grafana
        - Helm
        - ArgoCD
        - Multi-cloud experience
        - Security best practices
        """,
        "requirements": [
            "Docker",
            "Kubernetes",
            "Linux",
            "CI/CD",
            "Infrastructure as Code"
        ]
    },
    {
        "job_title": "Product Manager",
        "company": "Innovation Labs",
        "description": """
        Lead product strategy and roadmap for our SaaS platform.
        Work cross-functionally with engineering, design, and marketing teams.

        Required Skills:
        - Product management experience
        - Data analysis
        - User research
        - Agile methodologies
        - Metrics and KPIs
        - Communication skills

        Nice to Have:
        - B2B SaaS experience
        - SQL basics
        - A/B testing
        - Growth marketing
        - Technical background
        """,
        "requirements": [
            "Product Management",
            "Data Analysis",
            "Agile",
            "Communication",
            "User Research"
        ]
    },
    {
        "job_title": "Machine Learning Engineer",
        "company": "AI Research Group",
        "description": """
        Develop and deploy machine learning models for production systems.
        Work with large datasets and cutting-edge ML frameworks.

        Required Skills:
        - Python
        - TensorFlow or PyTorch
        - Machine Learning fundamentals
        - Statistics and probability
        - SQL
        - Git and Linux

        Nice to Have:
        - Deep Learning
        - NLP or Computer Vision
        - MLOps tools (MLflow, Kubeflow)
        - Cloud platforms
        - Apache Spark
        """,
        "requirements": [
            "Python",
            "TensorFlow/PyTorch",
            "Machine Learning",
            "Statistics",
            "SQL"
        ]
    },
    {
        "job_title": "Full Stack Developer",
        "company": "StartUp Ventures",
        "description": """
        Build end-to-end web applications from database to UI.
        Work in a fast-paced startup environment with rapid iteration.

        Required Skills:
        - JavaScript/TypeScript
        - React or Vue
        - Node.js or Python
        - Databases (SQL and NoSQL)
        - REST APIs
        - Git

        Nice to Have:
        - MongoDB
        - GraphQL
        - AWS or GCP
        - Docker
        - Mobile app development
        """,
        "requirements": [
            "JavaScript",
            "React/Vue",
            "Node.js/Python",
            "Databases",
            "REST APIs"
        ]
    },
    {
        "job_title": "QA Automation Engineer",
        "company": "Quality Assurance Pro",
        "description": """
        Design and implement automated test suites for web and mobile applications.
        Ensure product quality through comprehensive testing strategies.

        Required Skills:
        - Selenium or Cypress
        - Python or Java
        - Test frameworks (pytest, TestNG)
        - SQL for database testing
        - CI/CD integration
        - Communication skills

        Nice to Have:
        - API testing with Postman
        - Mobile testing with Appium
        - Performance testing tools
        - BDD frameworks (Cucumber, Behave)
        - Container technologies
        """,
        "requirements": [
            "Selenium/Cypress",
            "Python/Java",
            "Test Frameworks",
            "SQL",
            "CI/CD"
        ]
    },
]


def seed_jobs():
    """Seed Pinecone with sample job descriptions."""
    try:
        print("Initializing RAG service...")
        rag = RAGService()

        print(f"Indexing {len(SAMPLE_JOBS)} sample jobs...")
        rag.index_job_descriptions(SAMPLE_JOBS)

        print("✓ Successfully indexed sample jobs!")
        print(f"Jobs indexed:")
        for job in SAMPLE_JOBS:
            print(f"  - {job['job_title']} at {job['company']}")

    except Exception as e:
        print(f"✗ Error seeding jobs: {e}")
        sys.exit(1)


if __name__ == "__main__":
    seed_jobs()
