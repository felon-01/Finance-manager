
import os


def categorize(description: str) -> str:
    desc = description.lower()
    if "salary" in desc:
        return "Salary"
    if "rent" in desc:
        return "Rent"
    if any(w in desc for w in ["grocery", "food", "restaurant"]):
        return "Food"
    if any(w in desc for w in ["netflix", "entertainment", "movie"]):
        return "Entertainment"
    return "Other"
