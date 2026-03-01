import json
import sys
import os
import matplotlib
matplotlib.use('TkAgg') 

import matplotlib.pyplot as plt

def plot_reputation_simulation(filepath, persona_name):
    if not os.path.exists(filepath):
        print(f"Error: File {filepath} not found.")
        return

    with open(filepath, 'r') as f:
        data = json.load(f)

    days = [item['day'] for item in data]
    scores = [item['score'] for item in data]
    alphas = [item['alpha'] for item in data]
    betas = [item['beta'] for item in data]

    _, ax1 = plt.subplots(figsize=(10, 5))

    # Plot Reputation Score
    color_score = 'tab:blue'
    ax1.set_xlabel('Day')
    ax1.set_ylabel('Reputation Score (0-100)', color=color_score)
    line1 = ax1.plot(days, scores, color=color_score, linewidth=2, label='Reputation Score')
    ax1.set_ylim(0, 105)
    ax1.tick_params(axis='y', labelcolor=color_score)

    # Bayesian Parameters
    ax2 = ax1.twinx()
    line2 = ax2.plot(days, alphas, color='tab:green', linestyle='--', alpha=0.6, label='Alpha (Success)')
    line3 = ax2.plot(days, betas, color='tab:red', linestyle='--', alpha=0.6, label='Beta (Failure)')
    ax2.set_ylabel('Bayesian Parameters (Counts)')

    plt.title(f'Sensitivity Analysis: {persona_name}', fontsize=12)
    lines = line1 + line2 + line3
    ax1.legend(lines, [l.get_label() for l in lines], loc='upper left')
    ax1.grid(True, linestyle=':', alpha=0.6)
    plt.tight_layout()

    # 2. Force the plot window to be on top
    manager = plt.get_current_fig_manager()
    try:
        # Works for TkAgg backend
        manager.window.attributes('-topmost', True)
        manager.window.attributes('-topmost', False)
        manager.window.tkraise()
    except AttributeError:
        # Fallback for MacOSX backend
        manager.show()

if __name__ == "__main__":
    if len(sys.argv) > 2:
        plot_reputation_simulation(sys.argv[1], sys.argv[2])
        # 3. Show
        plt.show()
    else:
        print("Usage: python3 reputation_plotter.py <file_path> <persona_name>")