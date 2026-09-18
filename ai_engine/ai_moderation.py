def compute_fake_score(text_score, image_score, category, description):
    # Image is primary evidence — weight it higher than text
    final_score = (0.4 * text_score) + (0.6 * image_score)

    # Penalty if category keyword missing from description
    if category.lower() not in description.lower():
        final_score -= 0.05

    # Both scores very low → almost certainly fake
    if text_score < 0.3 and image_score < 0.3:
        final_score *= 0.4

    # Both scores high → boost confidence
    if text_score > 0.7 and image_score > 0.7:
        final_score = min(final_score + 0.05, 1.0)

    # Mismatch penalty — text and image tell different stories
    mismatch = abs(text_score - image_score)
    if mismatch > 0.3:
        final_score -= 0.25

    # Very low image score — photo clearly doesn't match category
    # Hard fail: image is the primary proof, if it's clearly wrong, cap the score
    if image_score < 0.20:
        final_score = min(final_score, 0.35)
        final_score -= 0.15
    elif image_score < 0.30:
        final_score -= 0.12

    # Very low text score — description is clearly spam/irrelevant
    # Even if image looks fine, bad text should drag the result down
    if text_score < 0.25:
        final_score -= 0.12

    return max(final_score, 0.0)

