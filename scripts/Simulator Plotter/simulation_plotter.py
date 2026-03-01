import json
import matplotlib.pyplot as plt

def plot_reputation_simulation(filepath):
    # Load the manually pasted JSON data
    with open(filepath, 'r') as f:
        data = json.load(f)

    # Extracting values for plotting
    days = [item['day'] for item in data]
    scores = [item['score'] for item in data]
    alphas = [item['alpha'] for item in data]
    betas = [item['beta'] for item in data]

    # Initialize the plot
    fig, ax1 = plt.subplots(figsize=(12, 6))

    # Plot Reputation Score on the primary Y-axis (0-100)
    color_score = 'tab:blue'
    ax1.set_xlabel('Day')
    ax1.set_ylabel('Reputation Score (0-100)', color=color_score)
    line1 = ax1.plot(days, scores, color=color_score, linewidth=2.5, label='Reputation Score')
    ax1.tick_params(axis='y', labelcolor=color_score)
    ax1.set_ylim(0, 105) # Maintain scale consistency for the score 

    # Create a secondary Y-axis for Alpha and Beta parameters
    ax2 = ax1.twinx()
    color_alpha = 'tab:green'
    color_beta = 'tab:red'
    ax2.set_ylabel('Bayesian Parameters (Counts)', color='black')
    line2 = ax2.plot(days, alphas, color=color_alpha, linestyle='--', alpha=0.7, label='Alpha (Successes)')
    line3 = ax2.plot(days, betas, color=color_beta, linestyle='--', alpha=0.7, label='Beta (Failures)')
    ax2.tick_params(axis='y')

    # Adding a title and a combined legend
    plt.title('Algorithmic Sensitivity Analysis: Trust Score vs. Bayesian Evidence', fontsize=14)
    lines = line1 + line2 + line3
    labels = [l.get_label() for l in lines]
    ax1.legend(lines, labels, loc='upper left')

    # Show grid for easier analysis
    ax1.grid(True, linestyle=':', alpha=0.6)
    
    plt.tight_layout()
    plt.show()

# Run the plotter
if __name__ == "__main__":
    plot_reputation_simulation('simulation_data.json')