"""Regression tests for the production career-ranking behavior."""

import sys
import unittest
from pathlib import Path


SCRIPTS_DIR = Path(__file__).resolve().parents[1] / "scripts"
sys.path.insert(0, str(SCRIPTS_DIR))

from predict import CareerPredictor  # noqa: E402


class CareerRankingTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.predictor = CareerPredictor()

    def test_explicit_data_science_goal_beats_generic_software_matches(self):
        assessment = {
            "education": "bachelors",
            "status": "student",
            "technicalSkills": ["Python", "Machine Learning", "Data Analysis", "SQL"],
            "softSkills": ["Analytical Thinking"],
            "careerInterests": ["Information Technology", "Mathematics/Statistics"],
            "preferredIndustries": ["Technology / Software"],
            "goals": "I want to become a data scientist and build machine learning systems",
        }

        matches = self.predictor.top_occupations(assessment, k=3)

        self.assertEqual(matches[0]["title"], "Data Scientists")
        self.assertEqual(matches[0]["goal_match"], 1.0)

    def test_structured_interests_choose_data_science_without_goal_text(self):
        assessment = {
            "education": "bachelors",
            "status": "student",
            "technicalSkills": ["Python", "Machine Learning", "Data Analysis", "SQL"],
            "softSkills": ["Problem Solving", "Analytical Thinking"],
            "careerInterests": ["Information Technology", "Mathematics/Statistics"],
            "preferredIndustries": ["Technology / Software"],
        }

        matches = self.predictor.top_occupations(assessment, k=3)

        self.assertEqual(matches[0]["title"], "Data Scientists")

    def test_accounting_experience_and_finance_interest_beat_auto_insurance(self):
        assessment = {
            "education": "masters",
            "status": "career_switcher",
            "technicalSkills": ["Microsoft Excel"],
            "softSkills": ["Analytical Thinking"],
            "languages": ["English"],
            "internships": ["Finance & Banking"],
            "jobExperience": ["Accountant"],
            "careerInterests": ["Finance"],
            "preferredIndustries": ["Finance & Banking"],
        }

        matches = self.predictor.top_occupations(assessment, k=3)

        self.assertEqual(matches[0]["title"], "Accountants and Auditors")
        self.assertGreaterEqual(matches[0]["similarity"], 0.75)
        self.assertTrue(matches[0]["strong_match"])

    def test_graphic_design_experience_beats_neighboring_animation_role(self):
        assessment = {
            "education": "diploma",
            "status": "freelancer",
            "technicalSkills": ["Figma"],
            "softSkills": ["Creativity"],
            "languages": ["English"],
            "internships": ["Marketing & Advertising"],
            "jobExperience": ["Graphic Designer"],
            "careerInterests": ["Visual Arts"],
            "preferredIndustries": ["Media & Entertainment"],
        }

        matches = self.predictor.top_occupations(assessment, k=3)

        self.assertEqual(matches[0]["title"], "Graphic Designers")
        self.assertGreaterEqual(matches[0]["similarity"], 0.75)
        self.assertTrue(matches[0]["strong_match"])

    def test_explicit_graphic_design_goal_is_respected(self):
        assessment = {
            "education": "bachelors",
            "status": "student",
            "technicalSkills": ["Figma", "Adobe Photoshop", "Adobe Illustrator", "Graphic Design"],
            "careerInterests": ["Visual Arts", "Applied Arts and Design"],
            "preferredIndustries": ["Media & Entertainment"],
            "goals": "I want to create brand identities as a graphic designer",
        }

        matches = self.predictor.top_occupations(assessment, k=3)

        self.assertEqual(matches[0]["title"], "Graphic Designers")

    def test_generic_goal_does_not_create_false_occupation_intent(self):
        scores = self.predictor._goal_scores("I want a stable, well-paid remote job with growth")

        self.assertEqual(scores, {})

    def test_models_in_sentence_does_not_mean_the_models_occupation(self):
        scores = self.predictor._goal_scores("I want to build machine learning models")
        models_code = next(
            code for code, title in self.predictor.occ_titles.items() if title == "Models"
        )

        self.assertNotIn(models_code, scores)


if __name__ == "__main__":
    unittest.main()
