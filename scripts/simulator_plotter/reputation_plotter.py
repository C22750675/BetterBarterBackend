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
    
    # Identify critical events for visualization
    dispute_days = [item['day'] for item in data if item['event'] == 'Dispute']

    _, ax1 = plt.subplots(figsize=(12, 6))

    # Plot Reputation Score (Primary Axis)
    color_score = '#1f77b4' # Solid Blue
    ax1.set_xlabel('Day')
    ax1.set_ylabel('Reputation Score (0-100)', color=color_score, fontweight='bold')
    ax1.plot(days, scores, color=color_score, linewidth=2.5, label='Reputation Score', zorder=3)
    ax1.set_ylim(0, 105)
    ax1.tick_params(axis='y', labelcolor=color_score)

    # Highlight Disputes (Vertical Red Lines)
    for d_day in dispute_days:
        ax1.axvline(x=d_day, color='#d62728', linestyle='--', alpha=0.4, linewidth=1, zorder=1)
    
    # Add a custom legend entry for Disputes if they exist
    if dispute_days:
        ax1.plot([], [], color='#d62728', linestyle='--', alpha=0.6, label='Dispute Event')

    # Bayesian Parameters (Secondary Axis)
    ax2 = ax1.twinx()
    ax2.plot(days, alphas, color='#2ca02c', linestyle=':', alpha=0.5, label='Alpha (Success)')
    ax2.plot(days, betas, color='#ff7f0e', linestyle=':', alpha=0.5, label='Beta (Failure)')
    ax2.set_ylabel('Bayesian Parameters (Counts)', color='grey')
    ax2.tick_params(axis='y', labelcolor='grey')

    plt.title(f'Reputation Simulation: {persona_name}', fontsize=14, pad=20)
    
    # Combined Legend
    lines_1, labels_1 = ax1.get_legend_handles_labels()
    lines_2, labels_2 = ax2.get_legend_handles_labels()
    ax1.legend(lines_1 + lines_2, labels_1 + labels_2, loc='upper left', frameon=True, shadow=True)
    
    ax1.grid(True, linestyle='--', alpha=0.3)
    plt.tight_layout()

    # Bring window to front
    manager = plt.get_current_fig_manager()
    try:
        manager.window.attributes('-topmost', True)
        manager.window.attributes('-topmost', False)
        manager.window.tkraise()
    except Exception:
        pass

if __name__ == "__main__":
    if len(sys.argv) > 2:
        plot_reputation_simulation(sys.argv[1], sys.argv[2])
        plt.show()
    else:
        print("Usage: python3 reputation_plotter.py <file_path> <persona_name>")