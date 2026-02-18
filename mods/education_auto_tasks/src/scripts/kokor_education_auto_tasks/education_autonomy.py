"""
Kokor Education Auto Tasks - Education Autonomy Module

Periodically checks active household sims for university tasks and homework,
then pushes relevant interactions to encourage autonomous completion.

Handles:
- University term papers (FinalCourseRequirement.PAPER)
- University presentations (FinalCourseRequirement.PRESENTATION)
- University exams (FinalCourseRequirement.EXAM)
- University homework completion
- Child/teen homework
"""

import services
import sims4.log
import sims4.resources

logger = sims4.log.Logger('KokorEducationAutoTasks', default_owner='kokor')

_alarm_handle = None
_recently_pushed = set()

# FinalCourseRequirement enum values (from university_enums.py)
FINAL_REQUIREMENT_NONE = 0
FINAL_REQUIREMENT_EXAM = 1
FINAL_REQUIREMENT_PAPER = 2
FINAL_REQUIREMENT_PRESENTATION = 3

# EnrollmentStatus enum values
ENROLLMENT_ENROLLED = 1
ENROLLMENT_PROBATION = 3

# Known homework interaction IDs (from LittleMsSam's BetterAutonomousHomework)
HOMEWORK_INTERACTIONS = {
    'child': [
        37253,   # Book_Homework_Child
        9210,    # Book_Homework_Child-Creative
        33901,   # Book_Homework_Child-ExtraCredit
        9211,    # Book_Homework_Child-Logic
        33895,   # Book_Homework_Child-Makeup
        9213,    # Book_Homework_Child-Motor
        9212,    # Book_Homework_Child-Social
    ],
    'teen': [
        36774,   # Book_Homework_Teen
        284518,  # book_Homework_Teen_Overachiever_ExtraCredit
        287859,  # book_Homework_Teen_Prepare_For_Test
        33902,   # Book_Homework_Teen-ExtraCredit
        33903,   # Book_Homework_Teen-Makeup
    ],
}

# Static commodities for education-related autonomy boosting
EDUCATION_COMMODITIES = {
    'homework': 27683,    # StaticCommodity_Study_Homework
    'research': 198588,   # staticCommodity_SkillResearch
    'writing': 109845,    # staticCommodity_SkillWriting
    'reading': 24727,     # staticCommodity_ReadBook
    'logic': 25291,       # staticCommodity_SkillLogic
    'programming': 115774, # staticCommodity_SkillProgramming
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


def _boost_commodity(sim_info, commodity_id, amount=100):
    """Boost a static commodity for a sim to nudge autonomy."""
    try:
        stat_manager = services.get_instance_manager(
            sims4.resources.Types.STATISTIC
        )
        if stat_manager is None:
            return False
        commodity = stat_manager.get(commodity_id)
        if commodity is None:
            return False
        tracker = sim_info.statistic_tracker
        if tracker is None:
            return False
        stat = tracker.get_statistic(commodity, add=True)
        if stat is not None:
            current_val = stat.get_value()
            stat.set_value(current_val + amount)
            return True
    except Exception as e:
        logger.warn('Failed to boost commodity {}: {}', commodity_id, e)
    return False


def _push_interaction(sim, affordance_id, target=None):
    """Push a super affordance onto a sim."""
    try:
        from interactions.context import InteractionContext, QueueInsertStrategy
        from interactions.priority import Priority

        affordance = services.affordance_manager().get(affordance_id)
        if affordance is None:
            return False

        if target is None:
            target = sim

        context = InteractionContext(
            sim,
            InteractionContext.SOURCE_SCRIPT_WITH_USER_INTENT,
            Priority.Low,
            insert_strategy=QueueInsertStrategy.LAST
        )

        result = sim.push_super_affordance(affordance, target, context)
        if result:
            logger.info('Pushed interaction {} onto sim {}', affordance_id, sim)
            return True
        return False
    except Exception as e:
        logger.warn('Failed to push interaction {}: {}', affordance_id, e)
        return False


def _find_homework_object(sim):
    """Find a homework object in the sim's inventory or on the lot."""
    try:
        # Check sim inventory first
        inventory = sim.inventory_component
        if inventory is not None:
            for obj in inventory:
                try:
                    obj_name = str(type(obj).__name__).lower()
                    if 'homework' in obj_name:
                        return obj
                    # Check object tags
                    tags = getattr(obj, 'tags', None)
                    if tags:
                        for tag in tags:
                            if 'homework' in str(tag).lower():
                                return obj
                except Exception:
                    continue

        # Check lot objects
        obj_manager = services.object_manager()
        if obj_manager is not None:
            for obj in obj_manager.valid_objects():
                try:
                    obj_name = str(type(obj).__name__).lower()
                    if 'homework' in obj_name:
                        return obj
                except Exception:
                    continue
    except Exception:
        pass
    return None


def _process_university_sim(sim_info):
    """Process a university-enrolled sim for task autonomy."""
    try:
        degree_tracker = sim_info.degree_tracker
        if degree_tracker is None:
            return False

        # Check enrollment status
        try:
            enrollment = degree_tracker.get_enrollment_status()
            if enrollment not in (ENROLLMENT_ENROLLED, ENROLLMENT_PROBATION):
                return False
        except Exception:
            return False

        sim = sim_info.get_sim_instance()
        if sim is None:
            return False

        if not _is_sim_idle(sim):
            return False

        sim_id = sim_info.sim_id
        if sim_id in _recently_pushed:
            return False

        pushed = False
        course_infos = getattr(degree_tracker, 'course_infos', {})

        for course_guid, course_info in course_infos.items():
            try:
                # Check if final requirement is completed
                final_completed = getattr(course_info, 'final_requirement_completed', True)
                if final_completed:
                    continue

                # Get the course schedule/level to find final requirement type
                course_slot = sim_info.career_tracker.get_career_by_uid(course_guid)
                if course_slot is None:
                    continue

                # Try to get the final requirement type from the course schedule
                try:
                    current_level = course_slot.current_level_tuning
                    if current_level is not None:
                        req_type = getattr(current_level, 'final_requirement_type', FINAL_REQUIREMENT_NONE)
                    else:
                        req_type = FINAL_REQUIREMENT_NONE
                except Exception:
                    req_type = FINAL_REQUIREMENT_NONE

                if req_type == FINAL_REQUIREMENT_PAPER:
                    # Boost writing-related commodities
                    _boost_commodity(sim_info, EDUCATION_COMMODITIES['writing'], 150)
                    _boost_commodity(sim_info, EDUCATION_COMMODITIES['research'], 150)
                    logger.info('Boosted PAPER commodities for sim {} (course {})',
                               sim_info, course_guid)
                    pushed = True

                elif req_type == FINAL_REQUIREMENT_PRESENTATION:
                    # Boost research and social commodities
                    _boost_commodity(sim_info, EDUCATION_COMMODITIES['research'], 150)
                    logger.info('Boosted PRESENTATION commodities for sim {} (course {})',
                               sim_info, course_guid)
                    pushed = True

                elif req_type == FINAL_REQUIREMENT_EXAM:
                    # Boost study/reading commodities
                    _boost_commodity(sim_info, EDUCATION_COMMODITIES['reading'], 150)
                    _boost_commodity(sim_info, EDUCATION_COMMODITIES['logic'], 150)
                    logger.info('Boosted EXAM commodities for sim {} (course {})',
                               sim_info, course_guid)
                    pushed = True

            except Exception as e:
                logger.warn('Error processing course {}: {}', course_guid, e)
                continue

        # Also boost homework commodity for all enrolled sims
        _boost_commodity(sim_info, EDUCATION_COMMODITIES['homework'], 100)

        if pushed:
            _recently_pushed.add(sim_id)
            return True

        return False

    except Exception as e:
        logger.error('Error processing university sim {}: {}', sim_info, e)
        return False


def _process_homework_sim(sim_info):
    """Process a child/teen sim for homework autonomy."""
    try:
        sim = sim_info.get_sim_instance()
        if sim is None:
            return False

        if not _is_sim_idle(sim):
            return False

        sim_id = sim_info.sim_id
        if sim_id in _recently_pushed:
            return False

        # Check if sim is child or teen
        from sims.sim_info_types import Age
        age = sim_info.age
        if age not in (Age.CHILD, Age.TEEN):
            return False

        # Boost homework commodity
        pushed = _boost_commodity(sim_info, EDUCATION_COMMODITIES['homework'], 150)

        # Try to push a homework interaction directly
        hw_object = _find_homework_object(sim)
        if hw_object is not None:
            age_key = 'child' if age == Age.CHILD else 'teen'
            for interaction_id in HOMEWORK_INTERACTIONS.get(age_key, []):
                if _push_interaction(sim, interaction_id, hw_object):
                    pushed = True
                    break

        if pushed:
            _recently_pushed.add(sim_id)
            logger.info('Pushed homework for sim {}', sim_info)
            return True

        return False

    except Exception as e:
        logger.error('Error processing homework sim {}: {}', sim_info, e)
        return False


def _check_education_autonomy(alarm_handle):
    """Periodic callback: check education autonomy for all active household sims."""
    try:
        _recently_pushed.clear()

        household = services.active_household()
        if household is None:
            return

        for sim_info in household.sim_info_gen():
            try:
                # Try university tasks first, then homework
                if not _process_university_sim(sim_info):
                    _process_homework_sim(sim_info)
            except Exception as e:
                logger.warn('Error checking sim {}: {}', sim_info, e)

    except Exception as e:
        logger.error('Error in education autonomy check: {}', e)


def _setup_alarm():
    """Set up the repeating alarm for education autonomy checks."""
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
            _check_education_autonomy,
            repeating=True
        )
        logger.info('Education Auto Tasks alarm registered (30 min interval)')

    except Exception as e:
        logger.error('Failed to set up education autonomy alarm: {}', e)


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
        logger.info('Kokor Education Auto Tasks: Zone injection successful')
    except Exception as e:
        logger.error('Failed to inject into Zone: {}', e)


# Module-level initialization
_inject()
logger.info('Kokor Education Auto Tasks module loaded')
