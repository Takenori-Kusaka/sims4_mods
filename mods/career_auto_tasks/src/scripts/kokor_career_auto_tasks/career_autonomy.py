"""
Kokor Career Auto Tasks - Career Autonomy Module

Periodically checks active household sims for uncompleted career daily tasks
and boosts relevant static commodities to encourage autonomous completion.

Architecture:
- Injects into Zone.on_loading_screen_animation_finished for zone load hook
- Registers a repeating alarm (every 30 sim minutes)
- Scans active household sims for career assignments
- Boosts relevant static commodities for sims with assignments
"""

import services
import sims4.log
import sims4.resources

logger = sims4.log.Logger('KokorCareerAutoTasks', default_owner='kokor')

_alarm_handle = None
_recently_pushed = set()


# --- Static commodity IDs for autonomy boosting ---
SKILL_COMMODITIES = {
    'write': 109845,      # staticCommodity_SkillWriting
    'program': 115774,    # staticCommodity_SkillProgramming
    'cook': 105606,       # staticCommodity_SkillCooking
    'exercise': 16707,    # staticCommodity_SkillFitness
    'art': 108831,        # staticCommodity_SkillPainting
    'social': 16714,      # staticCommodity_Socialize
    'read': 24727,        # staticCommodity_ReadBook
    'music': 109847,      # staticCommodity_SkillGuitar
    'garden': 188890,     # staticCommodity_SkillGardening
    'science': 25291,     # staticCommodity_SkillLogic
    'generic': 25291,     # default to logic
}


def _is_sim_idle(sim):
    """Check if a sim is mostly idle."""
    try:
        if sim is None:
            return False
        queue = sim.queue
        if queue is not None and len(queue) > 2:
            return False
        return True
    except Exception:
        return True


def _get_career_assignment_keywords(sim_info):
    """
    Analyze career assignments to determine what activities are needed.
    Returns a set of keyword hints.
    """
    keywords = set()
    try:
        career_tracker = sim_info.career_tracker
        if career_tracker is None:
            return keywords

        for career in career_tracker.careers.values():
            if not career.on_assignment:
                continue
            for assignment in career.active_assignments:
                try:
                    name = ''
                    if hasattr(assignment, '__name__'):
                        name = str(assignment.__name__).lower()
                    display = str(getattr(assignment, 'display_name', '')).lower()
                    combined = name + ' ' + display

                    keyword_map = {
                        'write': ('write', 'paper', 'report', 'article', 'book', 'novel'),
                        'program': ('program', 'code', 'hack', 'computer', 'tech', 'debug'),
                        'cook': ('cook', 'bake', 'meal', 'food', 'recipe', 'gourmet'),
                        'exercise': ('exercise', 'workout', 'train', 'fitness', 'run', 'jog'),
                        'art': ('paint', 'draw', 'art', 'creative', 'sculpt', 'sketch'),
                        'social': ('social', 'talk', 'friend', 'network', 'colleague', 'chat'),
                        'read': ('read', 'study', 'research', 'learn', 'skill', 'book'),
                        'music': ('music', 'play', 'instrument', 'guitar', 'piano', 'violin', 'sing'),
                        'garden': ('garden', 'plant', 'harvest', 'water', 'tend'),
                        'fish': ('fish', 'catch', 'angling'),
                        'photo': ('photo', 'picture', 'camera', 'photography'),
                        'science': ('experiment', 'science', 'lab', 'logic', 'rocket', 'analyze'),
                    }
                    for kw, patterns in keyword_map.items():
                        if any(p in combined for p in patterns):
                            keywords.add(kw)
                except Exception:
                    continue

        # If sim has uncompleted assignments but no keywords matched
        if not keywords:
            try:
                uncompleted = career_tracker.get_all_career_uncompleted_assignments()
                if uncompleted:
                    keywords.add('generic')
            except Exception:
                pass

    except Exception as e:
        logger.warn('Error analyzing career assignments: {}', e)

    return keywords


def _process_career_sim(sim_info):
    """Process a single sim for career task autonomy."""
    try:
        sim = sim_info.get_sim_instance()
        if sim is None:
            return

        if not _is_sim_idle(sim):
            return

        sim_id = sim_info.sim_id
        if sim_id in _recently_pushed:
            return

        career_tracker = sim_info.career_tracker
        if career_tracker is None:
            return

        # Only process sims with active assignments
        has_assignments = False
        for career in career_tracker.careers.values():
            if career.on_assignment:
                has_assignments = True
                break

        if not has_assignments:
            return

        keywords = _get_career_assignment_keywords(sim_info)
        if not keywords:
            return

        logger.info('Sim {} has career assignments, keywords: {}', sim_info, keywords)

        # Boost relevant static commodities to nudge autonomy
        pushed = False
        for keyword in keywords:
            commodity_id = SKILL_COMMODITIES.get(keyword)
            if commodity_id is None:
                continue
            try:
                stat_manager = services.get_instance_manager(
                    sims4.resources.Types.STATISTIC
                )
                if stat_manager is None:
                    continue
                commodity = stat_manager.get(commodity_id)
                if commodity is None:
                    continue
                tracker = sim_info.statistic_tracker
                if tracker is None:
                    continue
                stat = tracker.get_statistic(commodity, add=True)
                if stat is not None:
                    current_val = stat.get_value()
                    stat.set_value(current_val + 100)
                    pushed = True
                    logger.info('Boosted commodity {} for sim {}', commodity_id, sim_info)
            except Exception as e:
                logger.warn('Failed to boost commodity {}: {}', commodity_id, e)

        if pushed:
            _recently_pushed.add(sim_id)

    except Exception as e:
        logger.error('Error processing career sim {}: {}', sim_info, e)


def _check_career_autonomy(alarm_handle):
    """Periodic callback: check career autonomy for all active household sims."""
    try:
        _recently_pushed.clear()

        household = services.active_household()
        if household is None:
            return

        for sim_info in household.sim_info_gen():
            try:
                _process_career_sim(sim_info)
            except Exception as e:
                logger.warn('Error checking sim {}: {}', sim_info, e)

    except Exception as e:
        logger.error('Error in career autonomy check: {}', e)


def _setup_alarm():
    """Set up the repeating alarm for career autonomy checks."""
    global _alarm_handle
    try:
        import alarms
        from date_and_time import create_time_span

        if _alarm_handle is not None:
            try:
                alarms.cancel_alarm(_alarm_handle)
            except Exception:
                pass
            _alarm_handle = None

        zone = services.current_zone()
        if zone is None:
            logger.warn('No current zone, cannot set up alarm')
            return

        _alarm_handle = alarms.add_alarm(
            zone,
            create_time_span(minutes=30),
            _check_career_autonomy,
            repeating=True
        )
        logger.info('Career Auto Tasks alarm registered (30 min interval)')

    except Exception as e:
        logger.error('Failed to set up career autonomy alarm: {}', e)


def _teardown_alarm():
    """Cancel the repeating alarm."""
    global _alarm_handle
    if _alarm_handle is not None:
        try:
            import alarms
            alarms.cancel_alarm(_alarm_handle)
        except Exception:
            pass
        _alarm_handle = None


# --- Zone injection for initialization ---
_original_on_loading_screen_finished = None


def _injected_on_loading_screen_finished(self, *args, **kwargs):
    """Injected into Zone.on_loading_screen_animation_finished."""
    result = _original_on_loading_screen_finished(self, *args, **kwargs)
    try:
        _setup_alarm()
    except Exception as e:
        logger.error('Error in zone load hook: {}', e)
    return result


def _inject():
    """Inject our zone load hook into the Zone class."""
    global _original_on_loading_screen_finished
    try:
        import zone
        _original_on_loading_screen_finished = zone.Zone.on_loading_screen_animation_finished
        zone.Zone.on_loading_screen_animation_finished = _injected_on_loading_screen_finished
        logger.info('Kokor Career Auto Tasks: Zone injection successful')
    except Exception as e:
        logger.error('Failed to inject into Zone: {}', e)


# Module-level initialization
_inject()
logger.info('Kokor Career Auto Tasks module loaded')
